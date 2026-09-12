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

**`main` is the starting line and stays that way.** The app on `main` is never instrumented, because instrumenting it is step 1. Your applied work lives on step branches:

```bash
git checkout -b step-1-observe     # start a step
# ...do the work...
git add -A && git commit -m "step 1: log every report to Braintrust"
```

Each step branches off the previous one, so your working copy of the app keeps everything you've built.

### Landing what you learned

`main` should get better every time someone walks this path. When a step is finished, anything that improves the *starting experience* goes back to `main` — the step's write-up, a clearer explanation, a fix to the app, a nastier dog. What never goes back is the applied code: no Braintrust in `app/` on `main`.

```bash
git checkout main
# write learn/step-0N-*.md, fix whatever tripped you up
git commit -am "step N write-up, and the thing that confused me"

git checkout step-N-slug
git rebase main                    # your work, on top of the improved course
```

Then check that `main` is still a clean place to start:

```bash
bun run check:start
```

It fails if Braintrust has leaked into `app/` or the package list, and warns about leftovers — saved reports in the database, a missing key.

### Back to the start

```bash
git checkout main
rm app/data/happytails.db          # forget every generated report
```

The database rebuilds on the next launch: four dogs, today's logs, the original prompt. Tag a snapshot before a demo if you want a guaranteed return point — `git tag demo-monday`.

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
