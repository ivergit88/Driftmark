export function buildRevision(document, findings, selectedLines) {
  const parts = document.split(/(\r\n|\n|\r)/);
  for (const finding of findings) {
    if (!selectedLines.has(finding.docLine)) continue;
    const index = (finding.docLine - 1) * 2;
    if (parts[index] !== finding.original) {
      throw new Error("The documentation changed. Run a new review before exporting.");
    }
    parts[index] = finding.replacement;
  }
  return parts.join("");
}
