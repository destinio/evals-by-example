/**
 * Course scaffolding, not part of the daycare product.
 *
 * Serves the markdown in `learn/` as browsable pages at /learn, so you can read a
 * step beside the app it's changing. Source files referenced by the docs are
 * served as plain text at /source/<path>, which makes "open app/report.ts" a link
 * rather than a trip back to the editor.
 */
import { readdirSync } from 'node:fs'

const root = new URL('../', import.meta.url)
const learnDir = new URL('learn/', root)

const titleOf = (markdown: string, fallback: string) =>
  markdown.match(/^#\s+(.+)$/m)?.[1] ?? fallback

const slugOf = (file: string) => file.replace(/\.md$/, '')

/** Numbered step files, in order. README is the index; the template isn't a step. */
function pages() {
  return readdirSync(learnDir)
    .filter((f) => /^step-\d+-.+\.md$/.test(f))
    .sort()
    .map((f) => ({ slug: slugOf(f), file: f }))
}

/**
 * Markdown links point at files on disk. Rewrite them for the browser:
 * another doc becomes a /learn page, and any other repo file becomes /source.
 */
function fixLinks(html: string) {
  return html.replace(/href="([^"]+)"/g, (whole, href: string) => {
    if (/^(https?:|#|\/)/.test(href)) return whole
    if (href === 'learn/README.md' || href === 'README.md') return 'href="/learn"'
    if (href.endsWith('.md')) {
      const name = href.replace(/^learn\//, '')
      return name.startsWith('..') || href.startsWith('app/') || href === 'CLAUDE.md'
        ? `href="/source/${href}"`
        : `href="/learn/${slugOf(name)}"`
    }
    return `href="/source/${href.replace(/^\.\//, '')}"`
  })
}

const shell = (title: string, nav: string, body: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Happy Tails</title>
<style>
  :root { --ground:#fbf9f5; --card:#fff; --ink:#23201c; --soft:#6f6a62; --line:#e6e1d8;
          --brand:#1f6f4a; --brand-soft:#eaf3ee; --code:#f4f2ed; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--ground); color:var(--ink);
         font:16px/1.7 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  header { background:var(--card); border-bottom:1px solid var(--line); }
  .bar { max-width:1040px; margin:0 auto; padding:16px 20px; display:flex; gap:14px; align-items:baseline; }
  .logo { font-weight:650; }
  .bar a { color:var(--soft); text-decoration:none; font-size:.9rem; }
  .bar a:hover { color:var(--ink); }
  .layout { max-width:1040px; margin:0 auto; padding:28px 20px 80px; display:grid;
            grid-template-columns:210px 1fr; gap:40px; align-items:start; }
  nav { position:sticky; top:24px; font-size:.9rem; }
  nav h2 { font-size:.7rem; text-transform:uppercase; letter-spacing:.09em; color:var(--soft); margin:0 0 10px; }
  nav a { display:block; padding:6px 10px; border-radius:7px; color:var(--ink); text-decoration:none; }
  nav a:hover { background:var(--brand-soft); }
  nav a[aria-current="page"] { background:var(--brand); color:#fff; }
  article { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:34px 40px; min-width:0; }
  article > :first-child { margin-top:0; }
  h1 { font-size:1.7rem; letter-spacing:-.01em; text-wrap:balance; }
  h2 { font-size:1.2rem; margin-top:34px; padding-bottom:6px; border-bottom:1px solid var(--line); }
  h3 { font-size:1rem; margin-top:26px; }
  a { color:var(--brand); }
  code { background:var(--code); padding:2px 5px; border-radius:4px; font-size:.86em;
         font-family:ui-monospace, "SF Mono", Menlo, monospace; }
  pre { background:var(--code); border:1px solid var(--line); border-radius:10px; padding:16px 18px;
        overflow-x:auto; line-height:1.55; }
  pre code { background:none; padding:0; font-size:.82rem; }
  blockquote { margin:0; padding:12px 18px; background:var(--brand-soft); border-left:3px solid var(--brand);
               border-radius:0 8px 8px 0; }
  blockquote p { margin:0; }
  table { width:100%; border-collapse:collapse; font-size:.92rem; display:block; overflow-x:auto; }
  th, td { text-align:left; padding:9px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
  th { font-size:.72rem; text-transform:uppercase; letter-spacing:.07em; color:var(--soft); }
  hr { border:0; border-top:1px solid var(--line); margin:28px 0; }
  .plain { white-space:pre-wrap; font-family:ui-monospace, "SF Mono", Menlo, monospace; font-size:.8rem; line-height:1.5; }
  @media (max-width:760px) { .layout { grid-template-columns:1fr; } nav { position:static; } }
</style></head>
<body>
<header><div class="bar">
  <span class="logo">🐾 Happy Tails</span>
  <a href="/">← the app</a>
  <a href="/learn">the course</a>
</div></header>
<div class="layout">
  <nav><h2>Steps</h2>${nav}</nav>
  <article>${body}</article>
</div>
</body></html>`

function navHtml(current: string) {
  const mark = (slug: string) => (slug === current ? ' aria-current="page"' : '')
  const links = pages().map(
    (p, i) => `<a href="/learn/${p.slug}"${mark(p.slug)}>${i + 1}. ${p.slug.replace(/^step-\d+-/, '')}</a>`,
  )
  return `<a href="/learn"${mark('index')}>Overview</a>${links.join('')}`
}

async function renderMarkdown(file: URL, fallbackTitle: string) {
  const markdown = await Bun.file(file).text()
  return { title: titleOf(markdown, fallbackTitle), html: fixLinks(Bun.markdown.html(markdown)) }
}

export async function learnIndex() {
  const { title, html } = await renderMarkdown(new URL('README.md', learnDir), 'Learn')
  return new Response(shell(title, navHtml('index'), html), { headers: { 'content-type': 'text/html' } })
}

export async function learnPage(slug: string) {
  if (!pages().some((p) => p.slug === slug)) return new Response('No such step', { status: 404 })
  const { title, html } = await renderMarkdown(new URL(`${slug}.md`, learnDir), slug)
  return new Response(shell(title, navHtml(slug), html), { headers: { 'content-type': 'text/html' } })
}

/** Read a repo file as plain text, so the docs can link to the code they discuss. */
export async function sourceFile(path: string) {
  // Only files the course talks about, and nothing climbing out of the repo.
  if (!/^(app|learn)\/[\w.-]+$/.test(path) && !/^(CLAUDE|README)\.md$/.test(path)) {
    return new Response('Not available', { status: 404 })
  }
  const file = Bun.file(new URL(path, root))
  if (!(await file.exists())) return new Response('Not found', { status: 404 })

  const text = await file.text()
  const body = `<h1>${path}</h1><div class="plain">${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!)}</div>`
  return new Response(shell(path, navHtml(''), body), { headers: { 'content-type': 'text/html' } })
}
