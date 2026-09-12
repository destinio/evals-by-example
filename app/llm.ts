/**
 * The only place the model is configured.
 *
 * Any OpenAI-compatible endpoint works — here it's the Nous router, which serves
 * Claude models under vendor-prefixed ids like `anthropic/claude-haiku-4.5`.
 *
 * Nothing observes these calls yet. Wrapping this client is step 1 of the course
 * (see learn/step-01-observe.md), and it's a one-line change.
 */
import OpenAI from 'openai'

const apiKey = process.env.NOUS_API_KEY
if (!apiKey) {
  throw new Error('Set NOUS_API_KEY in .env — run `bun run setup` if you have not yet.')
}

export const llm = new OpenAI({
  baseURL: process.env.NOUS_BASE_URL ?? 'https://inference-api.nousresearch.com/v1',
  apiKey,
})

export const MODEL = process.env.MODEL ?? 'anthropic/claude-haiku-4.5'