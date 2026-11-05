# Build plan

Driftmark helps maintainers review stale documentation before shipping a release. The release notes are the authority for this comparison. The maintainer decides which suggestions to export.

1. Freeze the local validation rules and fixtures. Run focused tests before implementing them.
2. Integrate the documented hosted Otari chat endpoint and expose a receipt with model, usage, latency and input fingerprint. Use an open-weight model and allow a second configured model to rerun the same inputs. Gate all edits on matching source quotes.
3. Build the review workbench. The violet proof sheet shows old instructions and release evidence together. Icy paper `#edf0f8`, midnight ink `#181b30`, indigo `#3435a4`, lavender `#e2ddff` and evergreen `#184d43` separate editing, review and export. Georgia carries the headline and Segoe UI carries the workspace. Connect evidence to suggested edits inside each finding and stack the workbench on mobile.
4. Verify the example and export in a real browser, run the tests, then verify a live request with the participant's hosted account. Compare the live output against the labeled cases and record a 3–5 minute demo.

## Acceptance criteria

- A fresh clone runs with Node 22+ and has a clearly labeled no-key example. The app never routes arbitrary user inputs to the example response.
- Live review uses a hosted Otari endpoint with a server-side key, bounded input and output, and visible errors. The UI distinguishes actual returned metadata from fixture data.
- A proposed edit needs a literal quote from both inputs at the declared line. Missing, invented and duplicate references are discarded.
- Export requires user selection and preserves all unapproved lines and their line endings. An edited input invalidates the current review.
- An evaluation prints precision and recall against human-labeled line pairs and identifies its mode. Hosted model measurements require actual live calls.
