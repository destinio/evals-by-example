/**
 * Is `main` still a good starting point?
 *
 * Run before a demo, or after landing course changes. It checks the things that
 * quietly break the first ten minutes for whoever clones this next — most of all
 * that the app is still un-instrumented, because adding Braintrust is step 1 and
 * a leaked import spoils the entire exercise.
 *
 *   bun run check:start
 */
import { readdirSync, existsSync } from 'node:fs'

const root = new URL('../', import.meta.url).pathname
const problems: string[] = []
const notes: string[] = []

// 1. The app must not be instrumented.
const appFiles = readdirSync(`${root}app`).filter((f) => /\.(ts|html)$/.test(f))
for (const file of appFiles) {
  const text = await Bun.file(`${root}app/${file}`).text()
  const code = text
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/^\s*\/\/.*$/gm, '') // line comments
    .replace(/<!--[\s\S]*?-->/g, '') // html comments
  // The package being loaded, not the word — the course pages legitimately talk about Braintrust.
  const importsIt = /from\s+['"]braintrust['"]|(?:require|import)\(\s*['"]braintrust['"]\s*\)/.test(code)
  if (importsIt) problems.push(`app/${file} imports braintrust`)
}

const pkg = await Bun.file(`${root}package.json`).json()
if (pkg.dependencies?.braintrust) {
  problems.push('package.json lists braintrust — step 1 is `bun add braintrust`')
}

// A stale lockfile means every fresh clone shows bun.lock as modified right after setup.
const frozen = Bun.spawnSync(['bun', 'install', '--frozen-lockfile'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
if (frozen.exitCode !== 0) {
  problems.push('bun.lock is out of sync with package.json — run `bun install` and commit bun.lock')
}

// 2. The course has to be there, and reachable.
for (const doc of ['README.md', 'CLAUDE.md', 'learn/README.md', 'learn/step-01-observe.md', 'app/README.md']) {
  if (!existsSync(`${root}${doc}`)) problems.push(`missing ${doc}`)
}

const steps = readdirSync(`${root}learn`).filter((f) => /^step-\d+-.+\.md$/.test(f))
notes.push(`${steps.length} step file${steps.length === 1 ? '' : 's'} written: ${steps.map((s) => s.replace(/\.md$/, '')).join(', ')}`)

// 3. Keys, without printing them.
if (!process.env.NOUS_API_KEY) problems.push('NOUS_API_KEY not set — the app cannot write reports')
if (!process.env.BRAINTRUST_API_KEY) notes.push('BRAINTRUST_API_KEY not set (needed from step 1 onward)')
if (process.env.ANTHROPIC_API_KEY) {
  notes.push('ANTHROPIC_API_KEY is exported in this shell; harmless now that the app reads NOUS_API_KEY')
}

// 4. A fresh start means no generated reports lying around.
if (existsSync(`${root}app/data/happytails.db`)) {
  const { Database } = await import('bun:sqlite')
  const db = new Database(`${root}app/data/happytails.db`)
  const { n } = db.query('SELECT COUNT(*) AS n FROM reports').get() as { n: number }
  if (n > 0) notes.push(`${n} saved report${n === 1 ? '' : 's'} in the database — delete app/data/happytails.db for a clean demo`)
  db.close()
}

console.log()
for (const note of notes) console.log(`  · ${note}`)
if (problems.length) {
  console.log()
  for (const p of problems) console.log(`  ✗ ${p}`)
  console.log(`\n  ${problems.length} problem${problems.length === 1 ? '' : 's'} with the starting point.\n`)
  process.exit(1)
}
console.log('\n  ✓ Good starting point: app un-instrumented, course in place.\n')
