/**
 * The prompt Happy Tails was running when you joined: written in ten minutes by
 * someone who isn't a prompt engineer, and never measured since.
 *
 * This text only seeds the database on first run. After that the live prompt
 * lives in the `prompts` table and is edited from the Front desk screen, so the
 * app, the evals and the UI all read the same source.
 */
export const SEED_PROMPT = `You write daily report cards for Happy Tails Dog Daycare.
Write a short, warm report card for the owner based on the day's log.`;
