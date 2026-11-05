import { createHash } from "node:crypto";

export const MAX_INPUT_LENGTH = 12000;
const MAX_FINDINGS = 8;

export function prepareReview(document, release) {
  if (typeof document !== "string" || typeof release !== "string" || !document.trim() || !release.trim()) {
    throw new Error("Add both your documentation and release notes.");
  }
  if (document.length > MAX_INPUT_LENGTH || release.length > MAX_INPUT_LENGTH) {
    throw new Error("Each input can contain up to 12,000 characters.");
  }
  const docLines = document.split(/\r\n|\n|\r/);
  const releaseLines = release.split(/\r\n|\n|\r/);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([docLines, releaseLines]))
    .digest("hex");
  return { docLines, releaseLines, fingerprint };
}

function boundedText(value, limit, min = 1) {
  return typeof value === "string" && value.length <= limit && value.trim().length >= min &&
    !/[\u0000-\u001f\u007f\u2028\u2029]/u.test(value);
}

export function verifyFindings(candidates, review) {
  if (!Array.isArray(candidates)) throw new Error("The model did not return a findings array.");
  const accepted = new Map();
  for (const item of candidates) {
    if (accepted.size === MAX_FINDINGS) break;
    if (!item || !Number.isInteger(item.docLine) || !Number.isInteger(item.releaseLine) ||
        item.docLine < 1 || item.releaseLine < 1 || accepted.has(item.docLine)) continue;

    const { title, reason, docLine, docQuote, releaseLine, releaseQuote, replacement } = item;
    const original = review.docLines[docLine - 1];
    const evidence = review.releaseLines[releaseLine - 1];
    if (!boundedText(title, 100) || !boundedText(reason, 360) ||
        !boundedText(docQuote, 400, 12) || !boundedText(releaseQuote, 400, 12) ||
        !boundedText(replacement, 700) || replacement.trim() === original?.trim() ||
        !original?.includes(docQuote) || !evidence?.includes(releaseQuote)) continue;
    accepted.set(docLine, { title, reason, docLine, docQuote, releaseLine, releaseQuote, replacement, original });
  }
  const findings = [...accepted.values()].sort((left, right) => left.docLine - right.docLine);
  return { findings, discarded: candidates.length - findings.length };
}
