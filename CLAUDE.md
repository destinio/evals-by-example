# Working in this repo

## What this is

Two things at once:

1. **`app/`** — Happy Tails, a dog daycare's owner portal. An LLM writes each dog's daily report card from the front desk's log. Bun, SQLite, one model call, no framework.
2. **`learn/`** — a step-by-step course that turns that unmeasured app into a measured one using Braintrust.

The framing is a role-play: the learner has "just been hired" to make this company's AI better. The app is deliberately mediocre — the naive prompt invents facts, and finding that out with evidence is the curriculum.

## The course, in one glance

Nine steps, each ending in something demonstrable. The full table with demo beats is in `learn/README.md`; per-step exit criteria are in the `tutor` skill.

1. **Observe** — instrument the app (tracing)
2. **Score one thing** — first `Eval()` with a code scorer
3. **Keep the hard cases** — a dataset of awkward days
4. **Fix the prompt, prove it** — two experiments compared
5. **Judge what code can't** — LLM-as-judge, validated against human opinion
6. **Ask the humans** — thumbs and staff edits feeding back
7. **Iterate without deploying** — prompts and playground in Braintrust
8. **Watch production** — scoring live traffic, dashboards
9. **Ship it honestly** — trials, regression gates, `bt` in CI, and the demo run of show

Step files are written **as each step is worked through**, not in advance, so they can quote real scores and real regressions. `learn/course.json` is the outline — titles, slugs, what each step builds — and the site renders every step from it, showing unwritten ones as *planned*. Name step files by their slug there, follow `learn/step-template.md`, and change the outline first if a step's scope changes. After writing one, `bun run docs:build` and commit `docs/` so the published site keeps up. Writing step files is maintainer work on `main`, not something learners do. There's a `/tutor` skill in `.claude/skills/tutor` that carries the teaching approach and per-step checks — read it before guiding any step.

## Rules that matter

**Never pre-instrument the app.** `main` must stay free of Braintrust — no imports, no package dependency. Adding it is the learner's first exercise. If you're asked to fix or extend the app while on `main`, keep it that way. `bun run check:start` enforces this; run it after any change that lands on `main`.

**Learners work on a branch.** A fresh clone (or the installer) puts them on `my-course`; `main` stays clean so `git pull` brings in new steps. Don't introduce worktrees or per-step branches — the goal is the least setup possible for someone who just cloned the repo.

**The learner writes the learning code.** In `learn/`, put instructions and code blocks in the step's markdown file for them to apply themselves. Don't create or edit their working files for them, don't run their steps ahead of them, and don't skip ahead to the next step. Building or fixing `app/` is different — that's yours to do directly when asked.

**One idea per step.** Each step file has: why this matters, what you'll add, do it, check yourself, commit, and what's still missing. A step ends with something the learner couldn't do before.

**Keep terminal output short.** Braintrust's default eval reporter prints ~20 rows of token metrics per run; replace it with a silent reporter and a compact table when writing eval scripts. This has been an explicit complaint.

**Explain jargon on first use.** The learner is an experienced TypeScript developer with no eval background. Span, trace, dataset, scorer, experiment — define them, and tie every step back to what it does for a production prompt.

## Conventions

- **Bun** for everything: `bun run app`, `bun add`, `bun:sqlite`, `Bun.serve`, `Bun.markdown`. No Node, no tsx, no bundler.
- **Code style:** single quotes, no semicolons, 2-space indent.
- **Learner work** happens on the `my-course` branch in the clone itself. Starting over is `git switch main` plus deleting `app/data/happytails.db`.
- **Model access** is an OpenAI-compatible router: `NOUS_API_KEY` + `NOUS_BASE_URL`, model ids like `anthropic/claude-haiku-4.5`. Never rename that variable to `ANTHROPIC_API_KEY` — that name is often already exported in a shell, and in Bun a real env var beats `.env`, so the wrong key gets sent.
- **`writeReport()` in `app/report.ts` is the function under test.** Evals import it directly rather than copying the prompt, so measurements track what ships.
- Reports are saved in SQLite and read back; only **Regenerate** spends a model call.

## Quick facts

- Server: `http://localhost:3022` (`PORT` to change).
- Database: `app/data/happytails.db`, gitignored. Delete it to reseed four dogs and the v1 prompt.
- Cost: roughly $0.001 per report; a full four-dog run is under a penny.
- The four dogs are the test set: Bella (easy), Rufus (invented cheer), Nacho (buried medication and an incident), Mochi (numbers to get wrong).
