import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { checkExport } from "../src/otari.js";

function findPython() {
  for (const candidate of [
    { command: "python", args: [] },
    { command: "python3", args: [] },
    { command: "py", args: ["-3"] },
  ]) {
    const result = spawnSync(candidate.command, [...candidate.args, "--version"], { stdio: "ignore" });
    if (!result.error && result.status === 0) return candidate;
  }
  return null;
}

const python = findPython();
const config = { key: "local-test-token", host: "api.otari.ai" };

async function inspect(markdown, onCode = () => {}) {
  return checkExport(config, markdown, async (url, options) => {
    assert.equal(url, "https://api.otari.ai/api/v1/code/execute");
    assert.equal(options.method, "POST");
    const body = JSON.parse(options.body);
    onCode(body.code);
    const stdout = execFileSync(python.command, [...python.args, "-c", body.code], {
      encoding: "utf8",
      timeout: 5000,
    });
    return Response.json({ return_code: 0, stdout });
  });
}

test("checkExport executes its generated source and checks CRLF fenced Markdown", { skip: !python && "Python unavailable; sandbox source execution skipped" }, async () => {
  const markdown = "# Guide\r\n\r\n```sh\r\nrun app\r\n```\r\n";
  const result = await inspect(markdown);
  assert.equal(result.sha256, createHash("sha256").update(markdown, "utf8").digest("hex"));
  assert.equal(result.unclosedFenceLine, null);
});

test("checkExport reports an unclosed fence at its opening line", { skip: !python && "Python unavailable; sandbox source execution skipped" }, async () => {
  const result = await inspect("Intro\n```js\nconst x = 1;\n");
  assert.equal(result.unclosedFenceLine, 2);
});

test("checkExport accepts a closing fence longer than the opener", { skip: !python && "Python unavailable; sandbox source execution skipped" }, async () => {
  const result = await inspect("```\ninside\n````\n");
  assert.equal(result.unclosedFenceLine, null);
});

test("checkExport keeps mismatched fence characters open", { skip: !python && "Python unavailable; sandbox source execution skipped" }, async () => {
  const backtick = await inspect("```js\ninside\n~~~\n");
  const tilde = await inspect("~~~js\ninside\n```\n");
  assert.equal(backtick.unclosedFenceLine, 1);
  assert.equal(tilde.unclosedFenceLine, 1);
});

test("checkExport base64-encodes literal Python-looking Markdown", { skip: !python && "Python unavailable; sandbox source execution skipped" }, async () => {
  const literal = "'); print('should stay data'); #\nimport os; os.system('echo should stay data')";
  const markdown = "# Example\n\n" + literal + "\n";
  let generatedCode;
  const result = await inspect(markdown, (code) => { generatedCode = code; });
  assert.equal(result.sha256, createHash("sha256").update(markdown, "utf8").digest("hex"));
  assert.equal(result.unclosedFenceLine, null);
  assert.ok(generatedCode.startsWith("DATA = '" + Buffer.from(markdown, "utf8").toString("base64") + "'\n"));
  assert.equal(generatedCode.includes(literal), false);
});
