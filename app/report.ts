/**
 * Where a logged day becomes the report card an owner reads.
 *
 * This is the heart of the product and the function every eval in `learn/` calls.
 * Keep it importable and side-effect free apart from the model call: an eval that
 * tested a *copy* of this prompt would slowly stop describing what ships.
 *
 * The whole pipeline is: active prompt (from the database) + the day log as JSON
 * -> one chat completion -> Markdown text. No retries, no validation, no record
 * that it happened. That last part is what step 1 fixes.
 */
import { llm, MODEL } from "./llm";
import { activePrompt, saveReport } from "./db";
import type { DayLog } from "./dogs";

export type GeneratedReport = { body: string; promptVersion: string; model: string };

/**
 * Turn one dog's logged day into the report card their owner reads.
 *
 * Pass `prompt` to try different wording without touching the live one.
 */
export async function writeReport(
  dog: DayLog,
  prompt?: { version: string; body: string },
): Promise<GeneratedReport> {
  const active = prompt ?? activePrompt();

  const res = await llm.chat.completions.create({
    model: MODEL,
    max_tokens: 500,
    messages: [
      { role: "system", content: active.body },
      { role: "user", content: JSON.stringify(dog, null, 2) },
    ],
  });

  return {
    body: res.choices[0]?.message?.content ?? "",
    promptVersion: active.version,
    model: MODEL,
  };
}

/** Generate a fresh report for a dog and keep it. Used by the site's Generate/Regenerate button. */
export async function generateAndSave(dogId: string, dog: DayLog) {
  const generated = await writeReport(dog);
  return saveReport({
    dog_id: dogId,
    body: generated.body,
    prompt_version: generated.promptVersion,
    model: generated.model,
  });
}
