/**
 * Build the course as a static site in docs/, for GitHub Pages.
 *
 *   bun run docs:build
 *
 * Same renderer the app serves at /learn, in static mode: page links become
 * .html files and links to code point at GitHub instead of the local server.
 * Enable it under Settings → Pages → Deploy from branch → main, /docs.
 */
import { mkdirSync, rmSync } from 'node:fs'
import { pages, renderDoc, REPO } from '../app/learn'

const out = new URL('../docs/', import.meta.url).pathname

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

// Pages is Jekyll by default, which would ignore anything it doesn't understand.
await Bun.write(`${out}.nojekyll`, '')

// Served beside the site so `curl -fsSL <site>/install.sh | bash` works.
await Bun.write(`${out}install.sh`, Bun.file(new URL('install.sh', import.meta.url)))

const written: string[] = []

const index = await renderDoc('index', 'static')
await Bun.write(`${out}index.html`, index!)
written.push('index.html')

for (const page of pages()) {
  const html = await renderDoc(page.slug, 'static')
  if (!html) continue
  await Bun.write(`${out}${page.slug}.html`, html)
  written.push(`${page.slug}.html`)
}

console.log(`\n  docs/ built — ${written.length} page${written.length === 1 ? '' : 's'}`)
for (const f of written) console.log(`    ${f}`)
const [owner, repo] = REPO.replace('https://github.com/', '').split('/')
console.log(`
  Preview:  open docs/index.html
  Publish:  commit docs/, then GitHub → Settings → Pages → main /docs
            https://${owner}.github.io/${repo}/
`)
