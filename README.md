# Driftmark

A release preflight for open-source maintainers. Compare the instructions users will follow with what the next release actually does.

Driftmark pairs each proposed correction with literal quotations and line numbers from both inputs. Choose the edits you want and export the revised Markdown. A second model can audit the drafting model’s suggestions. The receipt records the metadata actually returned by hosted Otari.

## Run

Install Node 22.9 or newer, then run the following command in this folder.

```sh
npm start
```

Open http://127.0.0.1:4177. There are no dependencies to install. The bundled Harbor example runs without a key and is explicitly labeled as a synthetic example.

For live reviews, choose **Connect Otari** and enter a hosted workspace key, region and the model IDs copied from your workspace. The server holds the key in memory until it stops. Alternatively, copy `.env.example` to `.env` and fill it locally. The environment file is excluded from Git.

The hosted endpoint is `https://api.otari.ai/api/v1` for US accounts and `https://eu.api.otari.ai/api/v1` for EU accounts. Your key must have access to the configured models and your workspace needs available credits. Model availability, pricing and tools depend on the hosted account.

## Workflow

1. Paste current docs and release notes, up to 12,000 characters each. The release notes are the authority for this comparison.
2. Choose a drafting model. If a second model is configured, choose it as the auditor. It can reject draft suggestions.
3. Run the review and read both source quotes before selecting an edit.
4. Optionally check the selected Markdown in Otari’s code sandbox. The fixed Python check verifies the document hash and detects an unclosed Markdown code fence.
5. Download revised Markdown and the run receipt.

**Find official release notes with Otari** searches the official domain you specify through Otari’s search endpoint. It sends the query and domain. Open a returned source and paste its relevant text into the release field.

Both review inputs go to hosted Otari and its model providers. The optional sandbox check sends the selected document to Otari’s sandbox. Inputs and results stay in the local server/browser memory. They are written to disk when you download them. The app binds to the computer’s loopback interface and is designed for one local maintainer.

## Verify

```sh
npm test
npm run evaluate
```

The default evaluation exercises source validation against handwritten Harbor candidates. Its metrics describe that fixture check. To evaluate real model output on the five synthetic development cases, start the app, connect Otari, then run one of these commands.

```sh
npm run evaluate -- --hosted
npm run evaluate -- --hosted --audit
```

The second command requires two configured models. Both consume the account’s hosted credits. Line-pair precision and recall cover the small development set and should be read alongside manual review of replacement quality.

## Boundaries

Driftmark compares the text you provide. A matching source quotation establishes where a suggestion came from. The maintainer still decides whether the release applies and whether the proposed rewrite is correct. One finding replaces one documentation line. The sandbox check covers fenced-code delimiter balance and the document hash.

The application reports Otari request IDs, costs, routing attempts and fallback status when the gateway returns them. Workspace budgets, routing policies and gateway guardrails need to be configured in Otari and exercised in real requests before making judging claims.

See `docs/ENTRY.md` for the submission checklist and participant demo outline. The hackathon requires a 3–5 minute screen recording with the participant’s own voice. Hosted inference and final submission are still pending.

For a rehearsal based on an actual release, use the [pip 25.3 sample](examples/pip-25.3). It has three expected corrections and one command that should stay as written.
