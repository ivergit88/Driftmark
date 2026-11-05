import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { exampleCandidates, harbor } from "./fixtures.js";
import { getOtariConfig, requestReview, RequestError } from "./otari.js";
import { prepareReview, verifyFindings } from "./review.js";

const ASSETS = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/revision.js", ["revision.js", "text/javascript; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/mark.svg", ["mark.svg", "image/svg+xml"]],
]);
const BODY_LIMIT = 160000;

function json(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") {
    throw new RequestError(415, "Send an application/json request.");
  }
  if (Number(request.headers["content-length"]) > BODY_LIMIT) {
    request.resume();
    throw new RequestError(413, "The request is too large.");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > BODY_LIMIT) {
      request.resume();
      throw new RequestError(413, "The request is too large.");
    }
    chunks.push(chunk);
  }
  try {
    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error();
    return payload;
  } catch {
    throw new RequestError(400, "Send a valid JSON object.");
  }
}

function publicConfig(config) {
  return { connected: Boolean(config.key), region: config.region, models: config.models };
}

function readConnection({ key, region, models }) {
  if (typeof key !== "string" || !/^otk_[\w-]{16,250}$/u.test(key.trim())) {
    throw new RequestError(400, "Enter the workspace key beginning with otk_.");
  }
  if (typeof region !== "string" || typeof models !== "string") {
    throw new RequestError(400, "Choose your workspace region and model.");
  }
  try {
    return getOtariConfig({ OTARI_API_KEY: key, OTARI_REGION: region, OTARI_MODELS: models });
  } catch (error) {
    throw new RequestError(400, error.message);
  }
}

export function createApp({ env = process.env, fetcher = fetch } = {}) {
  let config = getOtariConfig(env);
  let reviewInProgress = false;
  return createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const host = request.headers.host || "";
    try {
      if (!/^(127\.0\.0\.1|localhost)(:\d{1,5})?$/u.test(host) ||
          (request.headers.origin && request.headers.origin !== "http://" + host) ||
          request.headers["sec-fetch-site"] === "cross-site") {
        throw new RequestError(403, "Open Driftmark on this computer’s loopback address.");
      }
      const { pathname } = new URL(request.url, "http://" + host);
      if (request.method === "GET" && ASSETS.has(pathname)) {
        const [file, contentType] = ASSETS.get(pathname);
        const body = await readFile(new URL("../public/" + file, import.meta.url));
        response.writeHead(200, { "Content-Type": contentType });
        return response.end(body);
      }
      if (request.method === "GET" && pathname === "/api/config") {
        return json(response, 200, publicConfig(config));
      }
      if (request.method === "GET" && pathname === "/api/example") {
        const { document, release } = harbor;
        const review = prepareReview(document, release);
        return json(response, 200, {
          document,
          release,
          report: {
            ...verifyFindings(exampleCandidates, review),
            receipt: { mode: "example", fingerprint: review.fingerprint },
          },
        });
      }
      if (request.method === "POST" && pathname === "/api/connect") {
        config = readConnection(await readJson(request));
        return json(response, 200, publicConfig(config));
      }
      if (request.method === "POST" && pathname === "/api/review") {
        const { document, release, model } = await readJson(request);
        let review;
        try {
          review = prepareReview(document, release);
        } catch (error) {
          throw new RequestError(400, error.message);
        }
        if (reviewInProgress) throw new RequestError(409, "A review is already running. Wait for it to finish.");
        reviewInProgress = true;
        try {
          return json(response, 200, await requestReview(config, model || config.models[0], review, fetcher));
        } finally {
          reviewInProgress = false;
        }
      }
      throw new RequestError(404, "This page was not found.");
    } catch (error) {
      const known = error instanceof RequestError;
      json(response, known ? error.status : 500, { error: known ? error.message : "Driftmark could not complete the request." });
    }
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = Number(process.env.DRIFTMARK_PORT || "4177");
  createApp().listen(port, "127.0.0.1", () => console.log("Driftmark is running at http://127.0.0.1:" + port));
}
