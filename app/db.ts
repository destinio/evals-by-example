/**
 * Everything the app remembers, in one SQLite file (app/data/happytails.db).
 *
 * Four tables:
 *   dogs      who's enrolled
 *   day_logs  today's log per dog, stored as JSON — the facts a report must stick to
 *   prompts   the report-writing instructions; exactly one row is active at a time
 *   reports   every report ever generated, newest shown to the owner
 *
 * `reports` deliberately keeps `prompt_version` and `model` alongside the text.
 * Without those you can't answer "did that prompt edit make things better?", which
 * is the question the whole course is aimed at.
 *
 * Delete the database file to reseed: four dogs, today's logs, the original prompt.
 */
import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { seedDogs } from "./dogs";
import { SEED_PROMPT } from "./prompt";
import type { DayLog } from "./dogs";

mkdirSync(new URL("./data/", import.meta.url), { recursive: true });
export const db = new Database(new URL("./data/happytails.db", import.meta.url).pathname, { create: true });
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS dogs (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, breed TEXT NOT NULL, emoji TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS day_logs (
    dog_id TEXT PRIMARY KEY REFERENCES dogs(id), data TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS prompts (
    version TEXT PRIMARY KEY, body TEXT NOT NULL, created_at TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dog_id TEXT NOT NULL REFERENCES dogs(id),
    body TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    model TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS reports_by_dog ON reports (dog_id, id DESC);
`);

// ---------- seeding ----------

const now = () => new Date().toISOString();

if (!db.query("SELECT 1 FROM dogs LIMIT 1").get()) {
  const insertDog = db.prepare("INSERT INTO dogs (id, name, breed, emoji) VALUES (?, ?, ?, ?)");
  const insertLog = db.prepare("INSERT INTO day_logs (dog_id, data, updated_at) VALUES (?, ?, ?)");
  for (const [id, dog] of Object.entries(seedDogs)) {
    insertDog.run(id, dog.name, dog.breed, dog.emoji);
    insertLog.run(id, JSON.stringify(dog), now());
  }
}

if (!db.query("SELECT 1 FROM prompts LIMIT 1").get()) {
  db.prepare("INSERT INTO prompts (version, body, created_at, is_active) VALUES (?, ?, ?, 1)").run(
    "v1",
    SEED_PROMPT,
    now(),
  );
}

// ---------- dogs & logs ----------

export type DogRow = { id: string; name: string; breed: string; emoji: string };

export const listDogs = () =>
  db.query("SELECT id, name, breed, emoji FROM dogs ORDER BY name").all() as DogRow[];

export function getDayLog(dogId: string): DayLog | undefined {
  const row = db.query("SELECT data FROM day_logs WHERE dog_id = ?").get(dogId) as { data: string } | null;
  return row ? (JSON.parse(row.data) as DayLog) : undefined;
}

export function saveDayLog(dogId: string, log: DayLog) {
  db.prepare("UPDATE day_logs SET data = ?, updated_at = ? WHERE dog_id = ?").run(
    JSON.stringify(log),
    now(),
    dogId,
  );
}

// ---------- prompts ----------

export type PromptRow = { version: string; body: string; created_at: string; is_active: number };

export const listPrompts = () =>
  db.query("SELECT version, body, created_at, is_active FROM prompts ORDER BY created_at").all() as PromptRow[];

export const activePrompt = () =>
  db.query("SELECT version, body, created_at, is_active FROM prompts WHERE is_active = 1").get() as PromptRow;

/** Edit the one prompt the app runs. (Versioning comes back when we start comparing prompts.) */
export function updateActivePrompt(body: string) {
  db.prepare("UPDATE prompts SET body = ? WHERE is_active = 1").run(body);
}

/** Save a prompt version (new or updated) and optionally make it the one the app uses. */
export function savePrompt(version: string, body: string, makeActive = true) {
  db.prepare(
    `INSERT INTO prompts (version, body, created_at, is_active) VALUES (?, ?, ?, 0)
     ON CONFLICT(version) DO UPDATE SET body = excluded.body`,
  ).run(version, body, now());
  if (makeActive) setActivePrompt(version);
}

export function setActivePrompt(version: string) {
  db.transaction(() => {
    db.prepare("UPDATE prompts SET is_active = 0").run();
    db.prepare("UPDATE prompts SET is_active = 1 WHERE version = ?").run(version);
  })();
}

// ---------- reports ----------

export type ReportRow = {
  id: number;
  dog_id: string;
  body: string;
  prompt_version: string;
  model: string;
  created_at: string;
};

/** The report the owner currently sees: the most recent one we generated. */
export const latestReport = (dogId: string) =>
  db.query("SELECT * FROM reports WHERE dog_id = ? ORDER BY id DESC LIMIT 1").get(dogId) as ReportRow | null;

export const reportHistory = (dogId: string) =>
  db.query("SELECT * FROM reports WHERE dog_id = ? ORDER BY id DESC LIMIT 20").all(dogId) as ReportRow[];

export function saveReport(r: Omit<ReportRow, "id" | "created_at">): ReportRow {
  const id = db
    .prepare(
      `INSERT INTO reports (dog_id, body, prompt_version, model, created_at)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
    )
    .get(r.dog_id, r.body, r.prompt_version, r.model, now()) as { id: number };
  return db.query("SELECT * FROM reports WHERE id = ?").get(id.id) as ReportRow;
}

/** Which dogs already have a report today — drives the list on the owner portal. */
export const dogsWithReports = () =>
  new Set((db.query("SELECT DISTINCT dog_id FROM reports").all() as { dog_id: string }[]).map((r) => r.dog_id));
