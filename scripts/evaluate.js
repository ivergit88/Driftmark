import { evaluationCases, exampleCandidates, harbor } from "../src/fixtures.js";
import { prepareReview, verifyFindings } from "../src/review.js";

const hosted = process.argv.includes("--hosted");
const useAudit = process.argv.includes("--audit");
const base = "http://127.0.0.1:" + (process.env.DRIFTMARK_PORT || "4177");

async function getJson(path, body) {
  const response = await fetch(base + path, body ? {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  } : undefined);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed with HTTP " + response.status);
  return result;
}

let config;
if (hosted) {
  config = await getJson("/api/config");
  if (!config.connected) throw new Error("Connect your hosted Otari workspace in the running app before evaluation.");
  if (useAudit && config.models.length < 2) throw new Error("Configure a second model to run the audit evaluation.");
}

const results = [];
const cases = hosted ? evaluationCases : [harbor];
for (const sample of cases) {
  const report = hosted
    ? await getJson("/api/review", {
      document: sample.document,
      release: sample.release,
      model: config.models[0],
      auditModel: useAudit ? config.models[1] : undefined,
    })
    : verifyFindings(exampleCandidates, prepareReview(sample.document, sample.release));
  const expected = new Set(sample.expected.map(([docLine, releaseLine]) => docLine + ":" + releaseLine));
  const actual = report.findings.map(({ docLine, releaseLine }) => docLine + ":" + releaseLine);
  const truePositive = actual.filter((pair) => expected.has(pair)).length;
  results.push({
    id: sample.id,
    expected: [...expected],
    actual,
    truePositive,
    falsePositive: actual.length - truePositive,
    falseNegative: expected.size - truePositive,
    discarded: report.discarded,
    auditRejected: report.auditRejected,
    receipt: report.receipt,
  });
}
const totals = results.reduce((sum, result) => ({
  truePositive: sum.truePositive + result.truePositive,
  falsePositive: sum.falsePositive + result.falsePositive,
  falseNegative: sum.falseNegative + result.falseNegative,
}), { truePositive: 0, falsePositive: 0, falseNegative: 0 });
console.log(JSON.stringify({
  mode: hosted ? "hosted Otari evaluation" : "fixture validation only",
  scope: hosted
    ? "Five synthetic development cases. Line-pair matching does not measure all aspects of rewrite quality."
    : "Handwritten Harbor candidates exercise source validation. These results do not measure model accuracy.",
  timestamp: new Date().toISOString(),
  ...totals,
  precision: totals.truePositive / (totals.truePositive + totals.falsePositive) || 0,
  recall: totals.truePositive / (totals.truePositive + totals.falseNegative) || 0,
  cases: results,
}, null, 2));
