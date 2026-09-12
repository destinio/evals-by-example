/**
 * Start a course step in its own worktree.
 *
 *   bun run step 1    → branch step-01-observe, folder ../<repo>-steps/step-01-observe, port 3023
 *   bun run step 2    → branched from step-01-observe, so step 1's work comes with it
 *   bun run step      → list what's checked out where
 *
 * Step names come from learn/course.json, so branches, folders and step files match.
 *
 * Why worktrees: your main folder never leaves `main`, so the starting point stays
 * clean and course improvements can be written there while step work carries on
 * in its own folder. Each step runs on its own port, so the naive app and a later
 * step can be open side by side.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { basename, dirname } from 'node:path'

const run = async (cmd: string[], cwd?: string) => {
  const proc = Bun.spawn(cmd, { cwd, stdout: 'pipe', stderr: 'pipe' })
  const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  await proc.exited
  return { code: proc.exitCode ?? 0, out: out.trim(), err: err.trim() }
}

// Always work relative to the *main* checkout, even if this is run from inside a step folder.
const here = new URL('../', import.meta.url).pathname
const worktrees = (await run(['git', 'worktree', 'list', '--porcelain'], here)).out
const mainDir = worktrees.match(/^worktree (.+)$/m)?.[1] ?? here.replace(/\/$/, '')
const stepsDir = `${dirname(mainDir)}/${basename(mainDir)}-steps`

const branches = (await run(['git', 'branch', '--format=%(refname:short)'], mainDir)).out.split('\n')

const course = JSON.parse(await Bun.file(`${mainDir}/learn/course.json`).text()) as {
  steps: { n: number; slug: string; title: string }[]
}

const usage = `
Usage:  bun run step <number>

${course.steps.map((s) => `  bun run step ${s.n}    ${s.title}`).join('\n')}
`

const args = process.argv.slice(2)

if (args.length === 0 || args[0] === '--list') {
  console.log(`\n${(await run(['git', 'worktree', 'list'], mainDir)).out}`)
  console.log(usage)
  process.exit(0)
}

const n = Number(args[0])
const step = course.steps.find((s) => s.n === n)
if (!step) {
  console.error(usage)
  process.exit(1)
}

const branch = step.slug
const dir = `${stepsDir}/${branch}`
const port = 3022 + n

if (existsSync(dir)) {
  console.log(`\n${branch} is already checked out. Carry on:\n\n  cd ${dir}\n  PORT=${port} bun run app\n`)
  process.exit(0)
}

// Each step builds on the one before it. Step 1 starts from main.
const previous = course.steps.find((s) => s.n === n - 1)?.slug
const base = n === 1 ? 'main' : previous && branches.includes(previous) ? previous : undefined
if (!base) {
  console.error(`\nNo branch for step ${n - 1} yet. Start that first, so step ${n} has its work to build on.\n`)
  process.exit(1)
}

mkdirSync(stepsDir, { recursive: true })

const add = branches.includes(branch)
  ? ['git', 'worktree', 'add', dir, branch]
  : ['git', 'worktree', 'add', '-b', branch, dir, base]

const created = await run(add, mainDir)
if (created.code !== 0) {
  console.error(created.err || created.out)
  process.exit(1)
}

// .env and node_modules are gitignored, so a new worktree starts without them.
if (existsSync(`${mainDir}/.env`)) await Bun.write(`${dir}/.env`, Bun.file(`${mainDir}/.env`))
console.log('  installing dependencies…')
await run(['bun', 'install'], dir)

console.log(`
🐶 Step ${n} — ${step.title} — is ready.

  branch   ${branch}   (from ${base})
  folder   ${dir}
  port     ${port}

Work there:

  cd ${dir}
  PORT=${port} bun run app

Your main folder stays on main. When the step is done:

  1. In this step folder, commit your work:
       git add -A && git commit -m "${branch}: ..."

  2. In the main folder, write up what you learned:
       cd ${mainDir}
       # learn/${branch}.md, plus anything that confused you
       bun run docs:build && git add -A && git commit -m "${branch} write-up"

  3. Back in the step folder, pull the improved course in:
       cd ${dir} && git merge main
`)
