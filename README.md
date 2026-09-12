# Happy Tails

**Learn LLM evals by fixing an app that's quietly lying to its customers.**

Happy Tails is a dog daycare. The front desk logs each dog's day; the site shows the owner a report card written by an LLM. It works, it looks fine, and nobody has ever checked whether it's true.

Rufus ate nothing, never played, and hid under a bench all morning. His report tells his owner he had a lovely, sociable day.

You've been hired to fix that — not by rewriting the prompt on a hunch, but by measuring it. The course in [`learn/`](learn/README.md) takes you from "no idea if it's any good" to scored experiments, datasets, human feedback, and production monitoring, using [Braintrust](https://braintrust.dev).

## Quick start

```bash
git clone <this repo> && cd btrust
bun run setup
```

`setup` checks your Bun version, installs dependencies, asks for the two API keys it needs, verifies both actually answer, and seeds the database. Then:

```bash
bun run app
```

Open **http://localhost:3022**, click **Rufus**, and read his report against the timeline underneath it. That gap is the whole project.

Then open **http://localhost:3022/learn** — the course is served beside the app — and start at step 1.

### What you need

- **[Bun](https://bun.sh) 1.4+**. No Node, no bundler, no framework.
- **A model API key.** Anything OpenAI-compatible. The default is the [Nous](https://portal.nousresearch.com) router, which serves Claude models under ids like `anthropic/claude-haiku-4.5`; set `NOUS_BASE_URL` and `MODEL` to point somewhere else.
- **A [Braintrust](https://braintrust.dev) account** from step 1 onward. The free tier covers this whole course comfortably.

Reports cost about a tenth of a cent each. Every experiment in the course is a few cents.

## What you'll build

Nine steps, each ending in something you can show someone:

| # | Step | You end up able to say |
|---|---|---|
| 1 | Observe | "Here's every report we've ever written, with its cost and the data behind it" |
| 2 | Score one thing | "67%, and here's the exact row that failed" |
| 3 | Keep the hard cases | "The awkward days are permanent now" |
| 4 | Fix the prompt, prove it | "v1 against v2, row by row, including what got *worse*" |
| 5 | Judge what code can't | "Code catches invented numbers; a judge catches buried medication" |
| 6 | Ask the humans | "A complaint on Tuesday is a test case on Wednesday" |
| 7 | Iterate without deploying | "Change the prompt, try it on 20 real days, ship it, no deploy" |
| 8 | Watch production | "Quality and cost per day, and an alert when either moves" |
| 9 | Ship it honestly | "This is what runs before anyone touches the prompt" |

Full descriptions in [learn/README.md](learn/README.md).

## Learning with an AI assistant

In Claude Code, this repo ships a **`/tutor`** skill. It works out which step you're on from your branch and your code, teaches one idea at a time, and checks your work — it won't do the steps for you. `CLAUDE.md` holds the same ground rules for any agent, so an assistant that's never seen this repo won't hand you finished answers.

## How the repo is laid out

| Path | What it is |
|---|---|
| [`app/`](app/README.md) | The product: Bun server, SQLite, one LLM call. Its README covers routes and schema. |
| [`learn/`](learn/README.md) | The course. One markdown file per step, also served at `/learn`. |
| `scripts/` | `setup`, `step` (worktrees), `check:start` |
| `CLAUDE.md` | Context and rules for AI agents working here |

## Commands

```bash
bun run setup          # first-time setup; --check to verify without prompting
bun run app            # the daycare at http://localhost:3022
bun run dev            # same, with hot reload
bun run step 2 score   # branch + worktree for a step, on its own port
bun run check:start    # is main still a clean starting point?
```

## How the branches work

**`main` is the starting line and stays un-instrumented** — adding Braintrust is step 1, so it can't already be there. `bun run check:start` enforces that.

Your step work lives on branches (`step-1-observe`, `step-2-score`, …), each off the last. What goes *back* to `main` is the course getting better: step write-ups, clearer explanations, app fixes. So the next run through — yours on demo day, or someone else's — starts from everything the last one learned.

`bun run step 4 prompt` puts a step in its own folder and port, so you can run the naive version and the fixed version side by side in two browser windows.

## Starting over

```bash
git checkout main
rm app/data/happytails.db    # forget every generated report
bun run check:start
```

The database reseeds on next launch: four dogs, today's logs, the original two-line prompt.

## The four dogs

They're the test set, and three of them are traps.

| Dog | Their day | What it catches |
|---|---|---|
| **Bella** | Ate everything, played, napped | Nothing. The control. |
| **Rufus** | Ate 0g of 200g, no play, hid under a bench | Invented cheer |
| **Nacho** | Carprofen at 12:05, snapped at another dog | Buried facts the owner needs |
| **Mochi** | Two meals, three play sessions, five potty breaks | Numbers quietly getting wrong |
