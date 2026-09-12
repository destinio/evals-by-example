# Learning Braintrust, on a real app

You've been hired by a dog daycare to make their AI better. This is the path.

Each step is one idea, one markdown file, and one commit. You write the code; the step file tells you what and why. Nothing here is a finished solution you paste blindly — the point is to leave with the habits, not the repo.

## Before step 1

1. The app runs (`bun run app`) and you've read a couple of report cards.
2. `.env` has `NOUS_API_KEY`. Get a free Braintrust account and add `BRAINTRUST_API_KEY` too — step 1 needs it.
3. You've seen the problem: click **Rufus**, compare his report to the timeline underneath.

## Stuck? Ask the tutor

In a Claude Code session in this repo:

```
/tutor
```

The tutor figures out where you are, explains the next idea, and checks your work when you say a step is done. Good moments to call it: "what's next", "check my work", "why isn't this showing up in Braintrust", or any time a word like *span* or *scorer* stops making sense.

It won't write the step for you. You'll get the explanation and the code to apply yourself, one idea at a time.

## How the steps work

Every step gets **its own folder** — a git worktree — and your main folder never leaves `main`.

```
evals-by-example/                  ← main: the clean starting point, never instrumented
evals-by-example-steps/
  step-01-observe/                 ← your step 1 work, port 3023
  step-02-score/                   ← builds on step 1, port 3024
```

Why bother: `main` can't accidentally pick up your step work, you never switch branches mid-thought, and every step runs on its own port — so the naive app on 3022 and your improved one on 3025 can be open side by side.

### Start a step

From your main folder:

```bash
bun run step 1
```

That creates branch `step-01-observe` in `../evals-by-example-steps/step-01-observe`, copies your `.env` across, installs dependencies, and prints what to run next:

```bash
cd ../evals-by-example-steps/step-01-observe
PORT=3023 bun run app
```

Step 2 onwards branches from the step before it, so your work carries forward. `bun run step 2` refuses to start until step 1 exists. Names come from `learn/course.json`, so the branch, the folder and the step's write-up all share one slug.

### Finish a step

Three moves. The first is your work; the other two make the course better for the next person.

**1. Commit your work — in the step folder.**

```bash
git add -A && git commit -m "step-01-observe: log every report to Braintrust"
```

**2. Write up what you learned — in the main folder.** The write-up, a clearer explanation, a fix to the app, a nastier dog: anything that improves the *starting experience*. Never the applied code — `main` stays free of Braintrust.

```bash
cd ../../evals-by-example
# write learn/step-01-observe.md, fix whatever tripped you up
bun run docs:build
git add -A && git commit -m "step-01-observe write-up"
bun run check:start                # fails if Braintrust leaked into app/
```

**3. Pull the improved course into your step — back in the step folder.**

```bash
cd ../evals-by-example-steps/step-01-observe
git merge main
```

`merge`, not `rebase`: your step branches are chained one after another and may be pushed, and merging never rewrites history under you.

### See what you've got

```bash
bun run step                        # every worktree, its branch and folder
```

### Back to the start

Your main folder already *is* the start. To clear the reports it's generated:

```bash
rm app/data/happytails.db           # reseeds on next launch: four dogs, the original prompt
```

Each worktree has its own database, so resetting one never touches another. Before a demo, tag a guaranteed return point: `git tag demo-monday`.

## The steps

Nine steps, each one leaving you able to *show* something, not just know it. The last column is the moment you'd put on a screen for your team.

| # | Step | What you build | Braintrust | The demo beat |
|---|---|---|---|---|
| 1 | **[Observe](step-01-observe.md)** ✅ | `wrapOpenAI` + `traced` in the app | Tracing, Instrumentation | "Every report we've ever written, with its cost and the data behind it" |
| 2 | **Score one thing** | A scorer in plain code, and your first `Eval()` | Evaluation | "67%. And here's the exact row that failed" |
| 3 | **Keep the hard cases** | A dataset: the four dogs plus deliberately nasty days | Datasets | "The awkward days are permanent now — nothing can quietly break them again" |
| 4 | **Fix the prompt, prove it** | A second prompt version and a second experiment | Experiment comparison | "v1 against v2, row by row, including what got *worse*" |
| 5 | **Judge what code can't** | An LLM-as-judge scorer, checked against your own opinion | Scorers, Loop | "Code catches invented numbers. A judge catches buried medication" |
| 6 | **Ask the humans** | Thumbs and staff corrections in the app, flowing back | Annotation, human review | "A complaint on Tuesday becomes a test case on Wednesday" |
| 7 | **Iterate without deploying** | The prompt pulled from Braintrust instead of SQLite | Playground, Prompts | "Change the prompt, try it on 20 real days, ship it — no deploy" |
| 8 | **Watch production** | Scorers running on live traffic, and a dashboard | Observation, Deployment | "Quality and cost per day, and an alert when either moves" |
| 9 | **Ship it honestly** | A pre-ship check you'd actually run | `bt` CLI, CI | "What runs before anyone changes the prompt" |

Steps 2 onward are written as you reach them, so each one describes what actually happened in your runs — real scores, real regressions, the false alarm your first scorer raises — rather than a script written in advance.

### Where it's going

Steps 1–4 are the core loop and stand alone: see it, score it, keep the hard cases, prove a change helped. Steps 5–6 handle what code can't judge and where human opinion enters. Steps 7–8 are what your colleagues will care about most — prompt changes that aren't deploys, and production that scores itself. Step 9 makes it routine, and ends by mapping all of it back to whatever prompt you're really responsible for.

## The words

You'll hit these constantly, and they're easy to confuse.

| Term | What it is |
|---|---|
| **Span** | One recorded step — a function call, a model call. |
| **Trace** | A span plus everything nested inside it. One report card is one trace. |
| **Log** | A trace from real use. Continuous, unpredictable, no right answer attached. |
| **Dataset** | A fixed set of test cases, usually an input and some notion of what good looks like. |
| **Task** | The code under test. Here: `writeReport()`. |
| **Scorer** | A function that grades one output, 0 to 1. Plain code, or another model. |
| **Experiment** | One run of the task over the dataset with the scorers applied. Has an average score, and can be compared to any earlier run. |

**Logs are what happened. Experiments are what would happen if.** They're different screens in Braintrust, and looking in the wrong one is the most common early confusion.

## The demo at the end

The point of the course is a working system; the point of the *repo* is that you can show it. Each step file ends with what you can now demonstrate, and step 9 assembles those into `learn/demo.md` — a run of show with timings, the commands to type, and the lines to say.

Two things make the demo land, and both are decisions made early:

- **Rufus.** A quiet, sad little day that the model turns into a social triumph. Everyone in the room sees the problem in five seconds without knowing anything about evals.
- **The numbers move.** The scores in your demo are real runs from this repo, not slides. The regressions are real too — including the one in step 4 where the fix breaks something else.

## The loop you're building toward

1. **Log** what production does.
2. **Find** the bad ones.
3. **Turn them into a dataset** with a notion of correct.
4. **Run an experiment** — that number is your baseline.
5. **Change the prompt**, run again, compare.
6. **Ship if it went up**, and keep the dataset forever, so the next change can't quietly break what you just fixed.

Step 5 is the payoff. Without it, every prompt edit is a coin flip — and the classic failure is fixing one complaint while breaking three things nobody retested.
