/**
 * Get a fresh clone running: dependencies, keys, a seeded database, and a check
 * that both services actually answer.
 *
 *   bun run setup           ask for anything missing
 *   bun run setup --check   verify only, never prompt (useful in CI or before a demo)
 */
import { existsSync } from 'node:fs'

const root = new URL('../', import.meta.url).pathname
const checkOnly = process.argv.includes('--check')
const interactive = !checkOnly && Boolean(process.stdin.isTTY)

const ok = (msg: string) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`)
const warn = (msg: string) => console.log(`  \x1b[33m!\x1b[0m ${msg}`)
const bad = (msg: string) => console.log(`  \x1b[31m✗\x1b[0m ${msg}`)
const step = (msg: string) => console.log(`\n\x1b[1m${msg}\x1b[0m`)

let blocked = false

// ---------------------------------------------------------------- bun

step('Bun')
const [major, minor] = Bun.version.split('.').map(Number)
if (major! > 1 || (major === 1 && minor! >= 4)) {
  ok(`Bun ${Bun.version}`)
} else {
  bad(`Bun ${Bun.version} — this project needs 1.4 or newer (it uses Bun.markdown and routes)`)
  blocked = true
}

// ---------------------------------------------------------------- dependencies

step('Dependencies')
if (existsSync(`${root}node_modules/openai`)) {
  ok('installed')
} else if (checkOnly) {
  bad('not installed — run `bun install`')
  blocked = true
} else {
  console.log('  installing…')
  const proc = Bun.spawn(['bun', 'install'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
  await proc.exited
  existsSync(`${root}node_modules/openai`) ? ok('installed') : bad('bun install failed — run it yourself to see why')
}

// ---------------------------------------------------------------- .env

step('Keys')

const envPath = `${root}.env`
const readEnv = async () => {
  if (!existsSync(envPath)) return {} as Record<string, string>
  const text = await Bun.file(envPath).text()
  return Object.fromEntries(
    text
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      }),
  ) as Record<string, string>
}

const env = await readEnv()

async function ask(name: string, description: string, required: boolean) {
  if (env[name]) return env[name]
  if (!interactive) {
    required ? bad(`${name} missing — ${description}`) : warn(`${name} missing — ${description}`)
    if (required) blocked = true
    return ''
  }
  console.log(`\n  ${description}`)
  const value = prompt(`  ${name}${required ? '' : ' (blank to skip)'}:`)?.trim() ?? ''
  if (!value && required) {
    bad(`${name} is required`)
    blocked = true
  }
  return value
}

const nousKey = await ask(
  'NOUS_API_KEY',
  'Model access. Any OpenAI-compatible endpoint works; this project defaults to the Nous router (portal.nousresearch.com), where keys start with sk-nous.',
  true,
)

const btKey = await ask(
  'BRAINTRUST_API_KEY',
  'Braintrust, free tier is plenty: braintrust.dev → Settings → API keys. Needed from step 1 onward, not to run the app.',
  false,
)

if (interactive && (nousKey !== env.NOUS_API_KEY || btKey !== env.BRAINTRUST_API_KEY)) {
  const lines = [
    '# Model access (any OpenAI-compatible endpoint)',
    `NOUS_API_KEY=${nousKey}`,
    '# NOUS_BASE_URL=https://inference-api.nousresearch.com/v1',
    '# MODEL=anthropic/claude-haiku-4.5',
    '',
    '# Braintrust, from step 1 onward',
    `BRAINTRUST_API_KEY=${btKey}`,
    '',
  ]
  await Bun.write(envPath, lines.join('\n'))
  ok('wrote .env')
}

if (process.env.ANTHROPIC_API_KEY) {
  warn('ANTHROPIC_API_KEY is exported in your shell. Harmless here — just never rename the model key to that, since a real env var beats .env in Bun.')
}

// ---------------------------------------------------------------- do the keys work

step('Connections')

const baseUrl = env.NOUS_BASE_URL || process.env.NOUS_BASE_URL || 'https://inference-api.nousresearch.com/v1'
const modelKey = nousKey || process.env.NOUS_API_KEY

if (!modelKey) {
  bad('no model key to test')
} else {
  try {
    const res = await fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${modelKey}` } })
    if (res.ok) ok(`model API answers (${new URL(baseUrl).host})`)
    else {
      bad(`model API returned ${res.status} — check the key and NOUS_BASE_URL`)
      blocked = true
    }
  } catch {
    bad(`could not reach ${baseUrl}`)
    blocked = true
  }
}

const braintrustKey = btKey || process.env.BRAINTRUST_API_KEY
if (!braintrustKey) {
  warn('no Braintrust key yet — the app runs fine without one; step 1 needs it')
} else {
  try {
    const res = await fetch('https://api.braintrust.dev/v1/project?limit=1', {
      headers: { Authorization: `Bearer ${braintrustKey}` },
    })
    res.ok ? ok('Braintrust key works') : bad(`Braintrust returned ${res.status} — check the key`)
  } catch {
    warn('could not reach Braintrust (offline?)')
  }
}

// ---------------------------------------------------------------- the database

step('Data')
const { listDogs, dogsWithReports } = await import('../app/db')
const dogs = listDogs()
const withReports = dogsWithReports()
ok(`${dogs.length} dogs seeded: ${dogs.map((d) => d.name).join(', ')}`)
if (withReports.size) {
  warn(
    `${withReports.size} of them already ${withReports.size === 1 ? 'has a saved report' : 'have saved reports'} — \`rm app/data/happytails.db\` for a clean start`,
  )
}

// ---------------------------------------------------------------- what now

if (blocked) {
  console.log('\n\x1b[31mSetup incomplete.\x1b[0m Fix the ✗ items above and run `bun run setup` again.\n')
  process.exit(1)
}

console.log(`
\x1b[1mReady.\x1b[0m

  bun run app       the daycare, at http://localhost:3022
                    click Rufus, then read the timeline under his report

  /learn            the course, in the browser beside the app
  /tutor            in Claude Code, a guide that knows where you are

First job: Rufus ate nothing, never played, and hid under a bench.
His report will tell his owner he had a lovely, sociable day.
`)
