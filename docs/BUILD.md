# Build plan

Driftmark helps maintainers review stale documentation before shipping a release. The release notes are the authority for this comparison. The maintainer decides which suggestions to export.

1. Freeze the local validation rules and fixtures. Run focused tests before implementing them.
2. Integrate the documented hosted Otari chat endpoint and expose a receipt with model, usage, latency and input fingerprint. Use an open-weight model and allow a second configured model to rerun the same inputs. Gate all edits on matching source quotes.
3. Build the review workbench. The violet proof sheet shows old instructions and release evidence together. Icy paper `#edf0f8`, midnight ink `#181b30`, indigo `#3435a4`, lavender `#e2ddff` and evergreen `#184d43` separate editing, review and export. Georgia carries the headline and Segoe UI carries the workspace. Connect evidence to suggested edits inside each finding and stack the workbench on mobile.
4. Verify the example and export in a real browser, run the tests, then verify a live request with the participant's hosted account. Compare the live output against the labeled cases and record a 3–5 minute demo.

## Acceptance criteria

- A fresh clone runs with Node 22.9+ and has a clearly labeled no-key example. The app never routes arbitrary user inputs to the example response.
- Live review uses a hosted Otari endpoint with a server-side key, bounded input and output, and visible errors. The UI distinguishes actual returned metadata from fixture data.
- A proposed edit needs a literal quote from both inputs at the declared line. Missing, invented and duplicate references are discarded.
- Export requires user selection and preserves all unapproved lines and their line endings. An edited input invalidates the current review.
- An evaluation prints precision and recall against human-labeled line pairs and identifies its mode. Hosted model measurements require actual live calls.

## Current state on November 5

The app has a drafting stage and a distinct, optional audit model that can veto suggestions. Official-domain release search and a fixed Markdown check use Otari’s documented search and code execution APIs. The receipt captures available gateway cost, request ID and fallback headers. Twenty-four local tests pass, including execution of the actual fixed Python check.

The participant signed in to hosted Otari in the in-app browser. The first EU Qwen request returned HTTP 402. Otari’s onboarding panel reported missing model pricing. Billing showed $0.00 with no deposits or credits. Successful inference and tool calls remain pending. A request for permission to email the organizer about registration and the advertised free credits is pending.

The local development service runs from this repository at http://127.0.0.1:4177. It holds the participant’s key only in memory. Re-enter the participant’s saved key after a restart. The code includes support for keeping an existing key while changing model settings.
