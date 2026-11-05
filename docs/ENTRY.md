# Driftmark submission notes

Driftmark is a release preflight for open-source maintainers. It compares existing documentation with release notes, proposes line-level corrections backed by quotes from both sources, and leaves the export decision with the maintainer.

This checklist tracks the remaining submission evidence. A hosted EU review with `alibaba/qwen-3.5-35b-a3b` returned HTTP 402 on November 5. Otari’s onboarding panel reported that it could not price the requested model. Billing separately showed $0.00 and no credits. Successful hosted inference, public repository publication, and the hackathon entry remain pending.

## Submission checklist

- [ ] Publish the project in a public GitHub repository. Add the verified repository URL here: **Pending**.
- [ ] Push the submission branch named `devs-wilding`. Confirm it contains the intended release and can be cloned without credentials or secrets.
- [ ] Confirm the first Otari integration commit is `db9f8dc3aa58ce174f4cf1e2c9a96d1e681f58bb`. Link the commit and check that it is present in the public repository: **Pending**.
- [ ] Use the participant's hosted Otari workspace to make real application requests. Save request IDs or dashboard evidence and record the exact models, returned metadata, usage, latency, and any fallback behavior. Hosted use is **Pending live verification**.
- [ ] Verify the configured model IDs and open-weight status from reliable model documentation. Demonstrate one qualifying model for 20 points. For the additional 10 points, demonstrate two distinct open-weight models doing different jobs. Neither qualification is confirmed yet.
- [ ] Review the evidence matrix below against live runs. Only claim a feature when the recording shows it actually used in Driftmark.
- [ ] Check the public repository for actual issues and pull requests. Add their links below, or record “None found after checking” if that is accurate. **Pending**.
- [ ] Record participant feedback in the participant's own words after trying the workflow. Keep unanswered prompts marked pending. **Pending**.
- [ ] Record a 3–5 minute screen capture with the participant's own voice. Do not use AI-generated video or voice. Confirm the recording shows the real application and actual Otari activity.
- [ ] Submit the entry on DoraHacks and verify the resulting public entry URL: **Pending**.

The stated deadline is November 12 at 01:59 Moscow time. The event prose also says November 11 at 23:59 without a timezone. Treat the earlier prose deadline as controlling and aim to submit early on November 11 Moscow time.

## Evidence matrix

The implementation notes in `src/otari.js` describe code paths, not proof that the hosted service or a configured workspace exercised them. All judging claims remain pending live verification.

| Rubric item | Current code evidence | Submission evidence and status |
| --- | --- | --- |
| Open-weight model, 20 points | The default configured model ID is `deepseek/deepseek-v4-pro-0813`. | Verify the exact model and its open-weight status, then capture a real Driftmark review. **Pending live verification**. |
| Second open-weight model for another purpose, 10 points | Up to three model IDs can be configured. An optional distinct `auditModel` can audit draft findings. | Verify both model IDs are open-weight and show each doing its distinct role in actual runs. **Pending live verification**. |
| Routing and fallbacks, 10 points | Hosted requests expose Otari fallback and attempt metadata in the receipt. | Show a real request routed or served through a fallback and capture returned metadata. **Pending live verification**. |
| MCP integrations, 10 points | No MCP integration is evidenced in the reviewed implementation. | Do not claim unless an MCP integration is added and demonstrated in the application. **Not evidenced**. |
| Web search or web fetch, 10 points | `searchReleases` calls Otari search, limits results to a supplied official domain, and validates returned HTTPS URLs. | Run it live in Driftmark and show the results and receipt. **Pending live verification**. |
| Code execution, 10 points | `checkExport` sends selected Markdown to Otari `/code/execute` for a hash and unclosed-fence check. | Run it live on an approved export and show the result and receipt. **Pending live verification**. |
| Budgets and spending limits, 10 points | Gateway budget errors are translated into visible spending-limit errors. Limits are enforced by the Otari workspace. | Demonstrate an actual workspace spending limit affecting an application request. **Pending live verification**. |
| Multiple models with distinct roles, 10 points | Optional `auditModel` must differ from the draft model and audits verified findings. | Show the draft and audit calls using different configured models. **Pending live verification**. |
| Guardrails, 10 points | Driftmark validates literal source quotes locally. Hosted Otari guardrails have not been configured or verified. | Configure an Otari guardrail and demonstrate its effect on an application request before claiming this item. **Not evidenced**. |
| Per-user budgets, 10 points | The reviewed configuration uses a server-side Otari key and has no evidenced per-user budget mechanism. | Do not claim unless per-user budgets are implemented and exercised in the application. **Not evidenced**. |
| Working application and real use case, 5 points | The documented use case is checking stale instructions against release notes before a release. | Record a real end-to-end review and maintainer-selected export. **Pending live verification**. |
| Clear integration demo, 5 points | Receipts are designed to show model, usage, latency, fallback, and input fingerprint where returned. | Participant explains and visibly demonstrates the claimed live features. **Pending recording**. |

## Timed participant demo outline

Target runtime is 3 minutes 45 seconds. Use the participant's own live narration and a direct screen recording. Show real runs only. If any call fails or a feature is unavailable, say so and leave that claim out of the submission.

| Time | What to show and say |
| --- | --- |
| 0:00–0:25 | Introduce yourself and Driftmark. State the problem: release instructions can go stale, and maintainers need evidence before changing them. |
| 0:25–0:55 | Open a short documentation sample and its release notes. Point out the lines that contradict each other and explain that release notes are the comparison authority. |
| 0:55–1:45 | Run a hosted Otari review. Show the selected model and real receipt, including usage, latency, request ID, and fallback fields when Otari returns them. Explain the hosted endpoint and that the API key stays server-side. |
| 1:45–2:30 | Inspect one suggested change. Show the quoted documentation and release lines, their line numbers, and how unsupported or mismatched citations are rejected. If the distinct audit model has been live-verified, show its separate audit call and model. |
| 2:30–3:05 | Demonstrate one additional live Otari feature that has been verified, such as domain-limited release search or code execution on the selected export. Show its receipt. Do not imply dashboard configuration alone earns credit. |
| 3:05–3:30 | Select the change for export and show the resulting Markdown check or export. Explain that the maintainer chooses what to accept. |
| 3:30–3:45 | Summarize the demonstrated capabilities and name any known limitation plainly. Close with the public repository and `devs-wilding` branch visible if time permits. |

## Participant feedback prompts

The participant should answer these after using Driftmark. Do not fill in responses on their behalf.

- When were you most tempted to skip Otari and call the provider directly? What happened? **Answer pending after hosted testing**.
- What did you end up building yourself that Otari should have done for you? **Answer pending after hosted testing**.
- If the rules had not required Otari, would you have continued using Otari? Why or why not? **Answer pending after hosted testing**.

## Links and verified activity

- Public repository: **Pending**
- `devs-wilding` branch: **Pending**
- First integration commit `db9f8dc3aa58ce174f4cf1e2c9a96d1e681f58bb`: **Pending**
- Actual issues or pull requests: **Pending repository check**
- Hosted Otari request evidence: **Pending live verification**
- Participant-recorded demo: **Pending**
- Participant feedback: **Pending**
- DoraHacks entry: **Not submitted**

## Official sources

- Event requirements and timezone-adjusted timeline. https://dorahacks.io/hackathon/mozilla-devs-wilding/detail
- Organizer registration instructions. https://otari.ai/devs-wilding
- Judging rubric. https://docs.google.com/document/d/1-spnCZ3f2SSki8cb6FnochjchdyttUsjjxfoE6aBnF4/edit
- Hosted API quickstart. https://docs.otari.ai/quickstart
