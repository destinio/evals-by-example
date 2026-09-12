# Step 1 — Observe

**The idea:** you can't improve what you can't see. Before any prompt work, make every report the app writes visible and reviewable.

> Working with Claude Code? Run `/tutor` and it'll walk this step with you, then check it.

```bash
git checkout -b step-1-observe
```

## Why this first

The staff say the reports are "sometimes weird." Try answering any of these today:

- How often is it weird?
- Weird how — invented facts, wrong tone, missing medication?
- What does a report cost us, and how slow is it?
- Show me the exact report that upset Mrs. Alvarez on Tuesday.

You can't answer one of them. The model call happens, the text lands on a screen, and it's gone. Every later step — scoring, datasets, comparing prompts — needs a record, and no record exists.

## What you'll add

Two wraps, doing different jobs:

- **`wrapOpenAI`** instruments the model client. Each call records its messages, tokens, cost and duration.
- **`traced` + `span.log`** wrap the *operation*: which dog, which prompt version, what your app handed over and got back.

The model call nests inside the operation, so one report card becomes one trace with two levels:

```
daily report                    input: Rufus's day log · output: the report card
└── chat.completions.create     system + user messages · 412 tokens · $0.0004 · 2.1s
```

Wrap only the client and you'll know a call happened but not who it was for. Wrap only the operation and you lose cost and tokens. You want both.

## Do it

**1. Install the SDK**

```bash
bun add braintrust
```

**2. `app/llm.ts` — wrap the client**

```ts
import OpenAI from 'openai'
import { initLogger, wrapOpenAI } from 'braintrust'

const apiKey = process.env.NOUS_API_KEY
if (!apiKey) {
  throw new Error('Set NOUS_API_KEY in .env — run `bun run setup` if you have not yet.')
}

// Where traces go. The project is created on first use.
export const logger = initLogger({ projectName: 'Happy Tails' })

export const llm = wrapOpenAI(
  new OpenAI({
    baseURL: process.env.NOUS_BASE_URL ?? 'https://inference-api.nousresearch.com/v1',
    apiKey,
  }),
)

export const MODEL = process.env.MODEL ?? 'anthropic/claude-haiku-4.5'
```

**3. `app/report.ts` — wrap the operation**

Add `import { traced } from 'braintrust'` at the top, then wrap the existing body of `writeReport`:

```ts
  return traced(
    async (span) => {
      const res = await llm.chat.completions.create({
        model: MODEL,
        max_tokens: 500,
        messages: [
          { role: 'system', content: active.body },
          { role: 'user', content: JSON.stringify(dog, null, 2) },
        ],
      })

      const body = res.choices[0]?.message?.content ?? ''

      span.log({
        input: dog,
        output: body,
        metadata: { dog: dog.name, prompt_version: active.version, model: MODEL },
      })

      return { body, promptVersion: active.version, model: MODEL }
    },
    { name: 'daily report' },
  )
```

**4. Generate some traffic**

Restart the server and click all four dogs, using **Regenerate** for any that already have a report.

## Check yourself

Open braintrust.dev → **Happy Tails** → **Logs**. You should have four traces named `daily report`. Expand one and find:

- the day log in the parent's **input**, and the report card in its **output**
- a child span for the model call, with the system and user messages
- **tokens, cost and duration** on that child
- your **metadata** — dog, prompt version, model

Now find Rufus's trace and read the output next to the input. Same fiction as on the website, except now it's a row you can point at, link to, and count.

## Then: metadata is free now and impossible later

Ask Braintrust: *show me only reports for dogs that were on medication.* You can't. Nothing recorded it.

Add facts about the situation to that `span.log` call:

```ts
        metadata: {
          dog: dog.name,
          prompt_version: active.version,
          model: MODEL,
          has_meds: dog.meds.length > 0,
          has_incidents: dog.incidents.length > 0,
          play_minutes: dog.play.reduce((n, p) => n + p.minutes, 0),
          ate_nothing: dog.meals.every((m) => m.eaten_g === 0),
        },
```

Regenerate the four reports, then filter Logs on `metadata.has_meds = true`. Nacho, and only Nacho.

**The habit worth keeping:** log the *situation*, not just input and output. The question you'll want to answer six months from now is "did quality drop on the hard cases?" — and it's only answerable if something back here marked which cases were hard.

## Commit

```bash
git add -A && git commit -m "step 1: log every report to Braintrust"
```

## What you can do now that you couldn't before

Read any report the app has ever written, with its cost, its latency, and the exact data it came from — and filter down to the situations you care about.

**What you still can't do:** say whether any of it is *good*. Four traces, zero judgements. That's step 2: scoring one specific thing, in plain code, with no AI involved.
