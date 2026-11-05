import test from "node:test";
import assert from "node:assert/strict";
import { prepareReview, verifyFindings } from "../src/review.js";
import { buildRevision } from "../public/revision.js";

const document = "# Setup\r\nInstall Harbor with the legacy command.\r\nSet a timeout of 15 seconds.\r\n";
const release = "# Harbor 2.0\nThe legacy command was removed in Harbor 2.0.\nThe timeout is unchanged.";
const candidate = {
  title: "The old install command was removed",
  reason: "The release removes the legacy command.",
  docLine: 2,
  docQuote: "Install Harbor with the legacy command.",
  releaseLine: 2,
  releaseQuote: "The legacy command was removed in Harbor 2.0.",
  replacement: "See the Harbor 2.0 installation guide.",
};

test("preserves line numbers and fingerprints the normalized model inputs", () => {
  const review = prepareReview(document, release);
  assert.deepEqual(review.docLines.slice(0, 3), [
    "# Setup", candidate.docQuote, "Set a timeout of 15 seconds.",
  ]);
  assert.equal(review.fingerprint, prepareReview(document.replaceAll("\r\n", "\n"), release).fingerprint);
  assert.notEqual(review.fingerprint, prepareReview(document, release + "!").fingerprint);
});

test("rejects absent, whitespace-only and oversized inputs", () => {
  assert.throws(() => prepareReview("  ", release), /both/);
  assert.throws(() => prepareReview(document, null), /both/);
  assert.throws(() => prepareReview("x".repeat(12001), release), /12,000/);
});

test("accepts real evidence and discards duplicate, fabricated and multiline candidates", () => {
  const review = prepareReview(document, release);
  const result = verifyFindings([
    { ...candidate, releaseLine: 3 },
    candidate,
    candidate,
    { ...candidate, docLine: 3, docQuote: "Set a timeout of 15 seconds.", replacement: "New\nline" },
    { ...candidate, docLine: "2" },
    null,
  ], review);
  assert.deepEqual(result.findings, [{ ...candidate, original: candidate.docQuote }]);
  assert.equal(result.discarded, 5);
});

test("rejects quotes with no substantive evidence and edits that change nothing", () => {
  const review = prepareReview(document, release);
  const result = verifyFindings([
    { ...candidate, docQuote: "Harbor" },
    { ...candidate, replacement: candidate.docQuote },
    { ...candidate, replacement: "             " },
  ], review);
  assert.deepEqual(result, { findings: [], discarded: 3 });
});

test("rewrites only approved lines and preserves mixed line endings", () => {
  const mixed = document.replace("# Setup\r\n", "# Setup\n");
  const selection = new Set([2]);
  const finding = { ...candidate, original: candidate.docQuote };
  assert.equal(buildRevision(mixed, [finding], selection), mixed.replace(candidate.docQuote, candidate.replacement));
  assert.equal(buildRevision(document, [finding], new Set()), document);
  assert.equal(buildRevision("first\rsecond", [{ ...finding, original: "second", replacement: "updated" }], selection), "first\rupdated");
});

test("rejects a stale edit even when the old quotation still occurs in that line", () => {
  assert.throws(() => buildRevision(
    document.replace(candidate.docQuote, "NOTE " + candidate.docQuote),
    [{ ...candidate, original: candidate.docQuote }],
    new Set([2]),
  ), /changed/);
});
