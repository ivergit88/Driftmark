import { buildRevision } from "./revision.js";

const byId = (id) => document.getElementById(id);
const docInput = byId("document");
const releaseInput = byId("release");
const model = byId("model");
const run = byId("run");
const exampleButton = byId("example");
const dialog = byId("connection-dialog");
const selected = new Set();
let config;
let report;
let runs = [];
let working = false;

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function notice(id, message = "", error = false) {
  const node = byId(id);
  node.textContent = message;
  node.toggleAttribute("data-error", error);
}

async function request(url, payload) {
  const response = await fetch(url, payload === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The request did not complete.");
  return result;
}

function updateControls() {
  run.disabled = working || !config?.connected || !docInput.value.trim() || !releaseInput.value.trim();
  model.disabled = working || !config?.connected;
  exampleButton.disabled = working;
  byId("open-connection").disabled = working;
}

function applyConfig(next) {
  config = next;
  byId("connection-status").textContent = next.connected ? "Otari key configured" : "Otari key needed for live runs";
  byId("open-connection").textContent = next.connected ? "Otari settings" : "Connect Otari";
  const options = next.connected ? next.models : ["Connect Otari to choose a model"];
  model.replaceChildren(...options.map((name) => new Option(name, name)));
  updateControls();
}

function updateSelection() {
  const count = selected.size;
  byId("download").disabled = count === 0;
  byId("selection").textContent = count + (count === 1 ? " edit selected" : " edits selected");
}

function clearReview() {
  report = undefined;
  selected.clear();
  updateSelection();
  byId("results").hidden = true;
}

function evidence(label, value, className) {
  const group = element("div", undefined, className);
  group.append(element("strong", label), element("code", value));
  return group;
}

function card(finding) {
  const node = element("article", undefined, "finding");
  const quoteGroup = element("div", undefined, "evidence");
  quoteGroup.append(
    evidence("Documentation · line " + finding.docLine, finding.docQuote),
    evidence("Release notes · line " + finding.releaseLine, finding.releaseQuote),
  );
  const approval = element("label", undefined, "approval");
  const checkbox = element("input");
  checkbox.type = "checkbox";
  checkbox.setAttribute("aria-label", "Include edit on line " + finding.docLine + " in export");
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) selected.add(finding.docLine);
    else selected.delete(finding.docLine);
    updateSelection();
  });
  approval.append(checkbox, document.createTextNode("Include this edit in the export"));
  node.append(
    element("h3", finding.title),
    element("p", finding.reason),
    quoteGroup,
    evidence("Proposed replacement", finding.replacement, "proposed"),
    approval,
  );
  return node;
}

function render(next) {
  clearReview();
  report = next;
  const { receipt, findings, discarded } = next;
  const hosted = receipt.mode === "hosted";
  const mode = byId("report-mode");
  mode.textContent = hosted ? "Hosted Otari run" : "Bundled example · no model call";
  mode.toggleAttribute("data-hosted", hosted);
  byId("summary").textContent =
    findings.length + (findings.length === 1 ? " suggested edit" : " suggested edits") +
    (discarded ? " · " + discarded + (discarded === 1 ? " candidate discarded by validation" : " candidates discarded by validation") : "");
  byId("finding-list").replaceChildren(...(findings.length
    ? findings.map(card)
    : [element("p", "This run found no edits backed by matching quotes.")]));
  const fields = hosted ? [
    ["Hosted endpoint", receipt.endpoint],
    ["Requested model", receipt.requestedModel],
    ["Returned model", receipt.returnedModel],
    ["Response ID", receipt.responseId],
    ["Tokens", receipt.usage?.total],
    ["Elapsed", (receipt.elapsedMs / 1000).toFixed(2) + " s"],
    ["Time (UTC)", receipt.timestamp],
  ] : [["Source", "Synthetic Harbor CLI release and deliberately invalid candidate"]];
  fields.push(["Input fingerprint", receipt.fingerprint]);
  byId("receipt-fields").replaceChildren(...fields.flatMap(([label, value]) =>
    [element("dt", label), element("dd", value ?? "Unavailable")]));

  if (hosted) {
    runs = [{ receipt, count: findings.length }, ...runs].slice(0, 12);
  }
  const comparable = runs.filter((entry) => entry.receipt.fingerprint === receipt.fingerprint);
  byId("recent").hidden = !hosted || comparable.length < 2;
  byId("run-history").replaceChildren(...comparable.map(({ receipt: item, count }) =>
    element("li", item.requestedModel + " · " + count + " edits · " + (item.elapsedMs / 1000).toFixed(2) + " s")));

  byId("results").hidden = false;
  byId("results-title").focus();
}

function setWorking(value) {
  working = value;
  docInput.readOnly = value;
  releaseInput.readOnly = value;
  updateControls();
}

function saveFile(name, content, mime) {
  const link = element("a");
  link.href = URL.createObjectURL(new Blob([content], { type: mime }));
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

for (const input of [docInput, releaseInput]) {
  input.addEventListener("input", () => {
    if (report) notice("notice", "Inputs changed. Run a new review before exporting.");
    clearReview();
    updateControls();
  });
}

exampleButton.addEventListener("click", async () => {
  setWorking(true);
  notice("notice");
  try {
    const example = await request("/api/example");
    docInput.value = example.document;
    releaseInput.value = example.release;
    render(example.report);
  } catch (error) {
    notice("notice", error.message, true);
  } finally {
    setWorking(false);
  }
});

byId("review-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (run.disabled) return;
  clearReview();
  setWorking(true);
  notice("notice", "Reviewing both inputs with hosted Otari…");
  try {
    const next = await request("/api/review", {
      document: docInput.value, release: releaseInput.value, model: model.value,
    });
    notice("notice");
    render(next);
  } catch (error) {
    notice("notice", error.message, true);
  } finally {
    setWorking(false);
  }
});

byId("open-connection").addEventListener("click", () => {
  byId("region").value = config?.region || "us";
  byId("models").value = config?.models.join(", ") || "";
  notice("connect-notice");
  dialog.showModal();
});
byId("close-connection").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => { byId("key").value = ""; });
byId("connection-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const save = byId("save-connection");
  save.disabled = true;
  try {
    applyConfig(await request("/api/connect", {
      key: byId("key").value, region: byId("region").value, models: byId("models").value,
    }));
    dialog.close();
    notice("notice", "Key saved locally. Run a hosted review to verify your connection.");
  } catch (error) {
    notice("connect-notice", error.message, true);
  } finally {
    save.disabled = false;
  }
});

byId("download").addEventListener("click", () => {
  if (!report || !selected.size) return;
  try {
    const revised = buildRevision(docInput.value, report.findings, selected);
    saveFile("driftmark-revised.md", revised, "text/markdown;charset=utf-8");
  } catch (error) {
    notice("notice", error.message, true);
  }
});

byId("save-receipt").addEventListener("click", () => {
  if (!report) return;
  const exported = {
    ...report.receipt,
    findings: report.findings.map(({ docLine, releaseLine }) => ({ docLine, releaseLine })),
    discarded: report.discarded,
    approvedDocLines: [...selected].sort((left, right) => left - right),
  };
  saveFile("driftmark-receipt.json", JSON.stringify(exported, null, 2) + "\n", "application/json");
});

request("/api/config").then(applyConfig).catch((error) => notice("notice", error.message, true));
