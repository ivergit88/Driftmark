import test from "node:test";
import assert from "node:assert/strict";
import { getOtariConfig, requestReview } from "../src/otari.js";
import { harbor, exampleCandidates } from "../src/fixtures.js";
import { prepareReview } from "../src/review.js";

const review = prepareReview(harbor.document, harbor.release);
const config = getOtariConfig({
  OTARI_API_KEY: "fake-test-token",
  OTARI_REGION: "eu",
  OTARI_MODELS: "test/open-a,test/open-b",
});

test("posts a bounded request to the hosted region and reports actual response metadata", async () => {
  const result = await requestReview(config, "test/open-b", review, async (url, options) => {
    assert.equal(url, "https://eu.api.otari.ai/api/v1/chat/completions");
    assert.equal(options.headers.Authorization, "Bearer fake-test-token");
    const body = JSON.parse(options.body);
    assert.equal(body.model, "test/open-b");
    assert.ok(body.max_tokens > 0);
    assert.match(body.messages[0].content, /untrusted/);
    assert.deepEqual(JSON.parse(body.messages[1].content).releaseNotes[2], {
      line: 3, text: review.releaseLines[2],
    });
    return Response.json({
      id: "test-completion",
      model: "reported-model",
      choices: [{ message: { content: "\x60\x60\x60json\n" + JSON.stringify({ findings: exampleCandidates }) + "\n\x60\x60\x60" } }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    });
  });
  assert.deepEqual(result.findings.map(({ docLine, releaseLine }) => [docLine, releaseLine]), harbor.expected);
  assert.equal(result.discarded, 1);
  assert.equal(result.receipt.mode, "hosted");
  assert.equal(result.receipt.responseId, "test-completion");
  assert.equal(result.receipt.returnedModel, "reported-model");
  assert.equal(result.receipt.usage.total, 300);
  assert.equal(result.receipt.fingerprint, review.fingerprint);
});

test("rejects unknown models before calling the gateway", async () => {
  await assert.rejects(requestReview(config, "wrong-model", review, () => {
    assert.fail("Unexpected gateway request");
  }), /configured model/);
});

test("does not return an upstream body or turn an error into fixture success", async () => {
  await assert.rejects(requestReview(config, config.models[0], review, async () => {
    return new Response("secret information from the gateway", { status: 401 });
  }), (error) => error.status === 502 && /API key/.test(error.message) && !error.message.includes("secret"));
});

test("reports invalid and truncated output as a failed review", async () => {
  for (const choice of [
    { message: { content: "not JSON" } },
    { finish_reason: "length", message: { content: '{"findings":[]}' } },
  ]) {
    await assert.rejects(requestReview(config, config.models[0], review, async () => {
      return Response.json({ choices: [choice] });
    }), /incomplete or invalid/);
  }
});
