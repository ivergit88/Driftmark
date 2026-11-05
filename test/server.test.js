import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";
import { harbor, exampleCandidates } from "../src/fixtures.js";

const server = createApp({ env: {} });
let base;
before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = "http://127.0.0.1:" + server.address().port;
});
after(() => new Promise((resolve) => server.close(resolve)));

function post(path, payload, headers = {}) {
  return fetch(base + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
}

test("bundled example is explicitly labeled and never needs a configured API key", async () => {
  const response = await fetch(base + "/api/example");
  assert.equal(response.status, 200);
  const example = await response.json();
  assert.equal(example.report.receipt.mode, "example");
  assert.equal(example.report.receipt.usage, undefined);
  assert.equal(example.report.findings.length, 3);
  assert.equal(example.report.discarded, 1);
});

test("own inputs require hosted access and never return example findings", async () => {
  const response = await post("/api/review", { document: "Old", release: "New" });
  assert.equal(response.status, 503);
  assert.deepEqual(Object.keys(await response.json()), ["error"]);
});

test("blocks cross-origin requests and does not expose the workspace key", async () => {
  const input = { key: "otk_synthetic_test_secret_key", region: "eu", models: "test/model" };
  const blocked = await post("/api/connect", input, { Origin: "https://third-party.example" });
  assert.equal(blocked.status, 403);
  const connected = await post("/api/connect", input, { Origin: base });
  assert.equal(connected.status, 200);
  assert.deepEqual(await connected.json(), { connected: true, region: "eu", models: ["test/model"] });
  const config = await (await fetch(base + "/api/config")).text();
  assert.equal(config.includes(input.key), false);
  const changed = await post("/api/connect", { key: "", region: "eu", models: "test/alternate" }, { Origin: base });
  assert.equal(changed.status, 200);
  assert.deepEqual(await changed.json(), { connected: true, region: "eu", models: ["test/alternate"] });
});

test("normal API entry points pass audit and search settings to hosted Otari", async () => {
  const calls = [];
  const hosted = createApp({
    env: { OTARI_API_KEY: "test-key", OTARI_MODELS: "test/draft,test/audit" },
    fetcher: async (url, options) => {
      const body = JSON.parse(options.body);
      calls.push({ url, body });
      if (url.endsWith("/search")) return Response.json({ results: [] });
      return Response.json({ choices: [{ message: { content: JSON.stringify(body.model === "test/audit"
        ? { approvedDocLines: [3] }
        : { findings: exampleCandidates }) } }] });
    },
  });
  await new Promise((resolve) => hosted.listen(0, "127.0.0.1", resolve));
  const origin = "http://127.0.0.1:" + hosted.address().port;
  const submit = (path, payload) => fetch(origin + path, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  try {
    const reviewed = await submit("/api/review", {
      document: harbor.document, release: harbor.release, model: "test/draft", auditModel: "test/audit",
    });
    assert.equal(reviewed.status, 200);
    assert.deepEqual((await reviewed.json()).findings.map(({ docLine }) => docLine), [3]);
    const searched = await submit("/api/search", { query: "Harbor release", domain: "github.com" });
    assert.equal(searched.status, 200);
    assert.equal(calls.length, 3);
    assert.deepEqual(calls[2].body.search_domain_filter, ["github.com"]);
  } finally {
    await new Promise((resolve) => hosted.close(resolve));
  }
});
