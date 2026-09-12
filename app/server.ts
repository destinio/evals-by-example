/**
 * The Bun server: two screens and a handful of JSON routes.
 *
 *   GET  /                    the owner portal + front desk (ui.html)
 *   GET  /api/dogs            the dog list, flagged with whether a report exists
 *   GET  /api/report?dog=     the SAVED report plus that dog's day log — no model call
 *   POST /api/report?dog=     writes a fresh report, saves it, returns it
 *   GET/PUT /api/log?dog=     read or correct one dog's logged day
 *   GET/PUT /api/prompt       read or edit the single prompt used for every dog
 *
 * Reports are generated once and read back afterwards, so clicking around the site
 * is free and only "Regenerate" costs a model call.
 */
import {
  activePrompt,
  dogsWithReports,
  getDayLog,
  latestReport,
  listDogs,
  saveDayLog,
  updateActivePrompt,
} from "./db";
import { generateAndSave } from "./report";
import { learnIndex, learnPage, sourceFile } from "./learn";
import type { DayLog } from "./dogs";

const PORT = Number(process.env.PORT ?? 3022);
const ui = new URL("./ui.html", import.meta.url);

// The model writes Markdown. Bun renders it; `<` is escaped first because
// Bun.markdown passes raw HTML through and model output shouldn't inject markup.
const render = (markdown: string) => Bun.markdown.html(markdown.replaceAll("<", "&lt;"));

const reportPayload = (row: ReturnType<typeof latestReport>) =>
  row && {
    id: row.id,
    body: row.body,
    html: render(row.body),
    promptVersion: row.prompt_version,
    model: row.model,
    createdAt: row.created_at,
  };

Bun.serve({
  port: PORT,
  routes: {
    "/": () => new Response(Bun.file(ui), { headers: { "content-type": "text/html" } }),

    // The course, readable beside the app it changes.
    "/learn": () => learnIndex(),
    "/learn/:slug": (req) => learnPage(req.params.slug),
    "/source/*": (req) => sourceFile(new URL(req.url).pathname.replace("/source/", "")),

    // --- owner portal ---

    "/api/dogs": () => {
      const withReports = dogsWithReports();
      return Response.json(listDogs().map((d) => ({ ...d, hasReport: withReports.has(d.id) })));
    },

    "/api/report": {
      // Show the saved report. No model call, no cost, same words every time.
      GET: (req) => {
        const id = new URL(req.url).searchParams.get("dog") ?? "";
        const log = getDayLog(id);
        if (!log) return Response.json({ error: `No dog called "${id}".` }, { status: 404 });
        return Response.json({ report: reportPayload(latestReport(id)), log });
      },

      // Write a new one and keep it. Old versions stay in the table.
      POST: async (req) => {
        const id = new URL(req.url).searchParams.get("dog") ?? "";
        const log = getDayLog(id);
        if (!log) return Response.json({ error: `No dog called "${id}".` }, { status: 404 });
        try {
          return Response.json({ report: reportPayload(await generateAndSave(id, log)), log });
        } catch (err) {
          console.error(err);
          return Response.json({ error: "The report couldn't be written just now." }, { status: 502 });
        }
      },
    },

    // --- front desk ---

    "/api/log": {
      GET: (req) => {
        const id = new URL(req.url).searchParams.get("dog") ?? "";
        const log = getDayLog(id);
        return log ? Response.json(log) : Response.json({ error: "Unknown dog." }, { status: 404 });
      },
      PUT: async (req) => {
        const id = new URL(req.url).searchParams.get("dog") ?? "";
        if (!getDayLog(id)) return Response.json({ error: "Unknown dog." }, { status: 404 });
        saveDayLog(id, (await req.json()) as DayLog);
        return Response.json({ ok: true });
      },
    },

    // One global prompt, used for every dog.
    "/api/prompt": {
      GET: () => Response.json(activePrompt()),
      PUT: async (req) => {
        const { body } = (await req.json()) as { body: string };
        updateActivePrompt(body);
        return Response.json(activePrompt());
      },
    },
  },

  fetch: () => new Response("Not found", { status: 404 }),
});

console.log(`🐾 Happy Tails running at http://localhost:${PORT}`);
