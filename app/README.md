# The app

Happy Tails' owner portal. Bun serves it, SQLite stores it, one LLM call writes each report.

```bash
bun run app     # http://localhost:3022
bun run dev     # same, with hot reload
```

## Two screens

**Owner portal** — pick a dog, read today's report card, regenerate it, and see the day's events below: stat tiles, a timeline of meals, naps and medication, play sessions, staff notes.

**Front desk** — edit the report prompt (one global prompt, used for every dog), and correct any dog's logged day.

Reports are written once and saved. Clicking a dog reads from SQLite; only **Regenerate** calls the model again.

## Files

| File | What it does |
|---|---|
| `server.ts` | Routes and the Bun server. Port 3022, or `PORT`. |
| `ui.html` | Both screens. Plain HTML and one module script, no framework. |
| `report.ts` | `writeReport()` — day log in, report card out. **The function the evals test.** |
| `db.ts` | SQLite: schema, seeding, and every query. |
| `prompt.ts` | The seed prompt, used once to fill the database. |
| `dogs.ts` | Seed data for four dogs, and the `DayLog` type. |
| `llm.ts` | The model client. |

`writeReport()` is deliberately separate from the server. Evals import that exact function, so what gets measured is what owners receive — a copied prompt would drift.

## Routes

| Route | Does |
|---|---|
| `GET /api/dogs` | The dog list, each flagged with whether a report exists |
| `GET /api/report?dog=bella` | The saved report plus that dog's day log. No model call. |
| `POST /api/report?dog=bella` | Writes a fresh report, saves it, returns it |
| `GET /api/log?dog=bella` | One dog's logged day |
| `PUT /api/log?dog=bella` | Replace that day log |
| `GET /api/prompt` | The prompt in use |
| `PUT /api/prompt` | Change it |

## Schema

- **dogs** — id, name, breed, emoji
- **day_logs** — one row per dog, the log as JSON
- **prompts** — version, body, is_active. One row is active; the app uses it for every dog.
- **reports** — every report ever generated, newest wins. Keeps prompt version and model, so you can tell which words produced which report.

Database lives at `app/data/happytails.db` and is gitignored. Delete it to reseed.

## The four dogs

They aren't decoration — each is a different way for a report to go wrong.

| Dog | Their day | The trap |
|---|---|---|
| **Bella** | Ate everything, played, napped | None. The easy case, and your control. |
| **Rufus** | Ate 0g of 200g, no play, hid under a bench | Invented cheer. A quiet day becomes a lovely one. |
| **Nacho** | Carprofen at 12:05, snapped at Biscuit | Buried facts. Medication and the incident get softened or hidden. |
| **Mochi** | Two meals, three play sessions, five potty breaks | Wrong numbers. Lots to add up and get subtly wrong. |

## Markdown

The model writes Markdown; `Bun.markdown.html()` renders it in the route. `<` is escaped first, because that renderer passes raw HTML through. The raw text is what gets stored and scored — rendering is presentation only.
