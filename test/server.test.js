import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

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
});
