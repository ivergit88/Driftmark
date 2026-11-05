import test from "node:test";
import assert from "node:assert/strict";
import { getOtariConfig, requestReview, searchReleases, checkExport } from "../src/otari.js";
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

test("the second model audits literal candidates and can only veto, not add or rewrite", async () => {
  const models = getOtariConfig({
    OTARI_API_KEY: "fake-test-token", OTARI_MODELS: "test/drafter,test/auditor",
  });
  const requests = [];
  const result = await requestReview(models, "test/drafter", review, async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body.model);
    const drafter = body.model === "test/drafter";
    return Response.json({
      choices: [{ message: { content: JSON.stringify(drafter
        ? { findings: exampleCandidates }
        : { approvedDocLines: [3, 5] }) } }],
      usage: { cost_usd: "0.000431" },
    }, { headers: { "Otari-Request-ID": drafter ? "draft-id" : "audit-id", "Otari-Fallback": "true" } });
  }, { auditModel: "test/auditor" });
  assert.deepEqual(requests, ["test/drafter", "test/auditor"]);
  assert.deepEqual(result.findings.map(({ docLine }) => docLine), [3, 5]);
  assert.equal(result.auditRejected, 1);
  assert.equal(result.receipt.audit.requestId, "audit-id");
  assert.equal(result.receipt.requestId, "draft-id");
  assert.equal(result.receipt.fallback, true);
  assert.equal(result.receipt.usage.costUsd, "0.000431");
});

test("surfaces an Otari budget refusal using the stable response headers", async () => {
  await assert.rejects(requestReview(config, config.models[0], review, async () => new Response(null, {
    status: 403,
    headers: { "Otari-Error-Code": "budget_exceeded", "Otari-Budget-Scope": "workspace" },
  })), /spending limit.*workspace/);
});

test("explains a pricing refusal separately from an empty workspace balance", async () => {
  await assert.rejects(requestReview(config, config.models[0], review, async () => new Response(null, {
    status: 402, headers: { "Otari-Error-Code": "pricing_required" },
  })), /no usable price/);
});

test("search shows gateway sources and filters unsafe URLs without reading local docs", async () => {
  const result = await searchReleases(config, "Harbor 2.0 release", "github.com", async (url, options) => {
    assert.ok(url.endsWith("/api/v1/search"));
    assert.deepEqual(JSON.parse(options.body).search_domain_filter, ["github.com"]);
    return Response.json({ search_tool: "example-test", results: [
      { url: "https://github.com/example/harbor/releases/tag/v2", title: "Harbor v2", snippet: "A release." },
      { url: "javascript:alert(1)", title: "Invalid" },
      { url: "https://notgithub.com/example", title: "Wrong host" },
    ] });
  });
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].title, "Harbor v2");
});

test("sandbox check sends fixed code and requires matching Markdown output", async () => {
  const input = "# Quickstart\n\n```sh\nharbor setup\n```\n";
  const result = await checkExport(config, input, async (url, options) => {
    assert.ok(url.endsWith("/api/v1/code/execute"));
    assert.match(JSON.parse(options.body).code, /import base64/);
    return Response.json({ return_code: 0, stdout: JSON.stringify({
      sha256: "3377b9372ae4437ed919a1c59939e3682d19976b3b8104a2ee6f00a1b73c19cc",
      unclosedFenceLine: null,
    }) });
  });
  assert.equal(result.unclosedFenceLine, null);
});
