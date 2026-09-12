/**
 * Start a step in its own worktree, so several are checked out at once and you
 * can run two versions of the app side by side.
 *
 *   bun run step 2 score      branch step-2-score, checked out in ../btrust-step-2-score
 *   bun run step --list       every worktree, with its branch and port
 */
import { existsSync } from 'node:fs'
import { basename } from 'node:path'

const root = new URL('../', import.meta.url).pathname.replace(/\/$/, '')
const parent = root.slice(0, root.lastIndexOf('/'))
const repoName = basename(root)

const run = async (cmd: string[], cwd = root) => {
  const proc = Bun.spawn(cmd, { cwd, stdout: 'pipe', stderr: 'pipe' })
  const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
  await proc.exited
  return { code: proc.exitCode ?? 0, out: out.trim(), err: err.trim() }
}

const args = process.argv.slice(2)

if (args.includes('--list') || args.length === 0) {
  const { out } = await run(['git', 'worktree', 'list'])
  console.log(`\n${out}\n`)
  if (args.length === 0) console.log('Usage: bun run step <number> <slug>    e.g. bun run step 2 score\n')
  process.exit(0)
}

const [number, ...rest] = args
const slug = rest.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-')
if (!/^\d+$/.test(number ?? '') || !slug) {
  console.error('Usage: bun run step <number> <slug>    e.g. bun run step 2 score')
  process.exit(1)
}

const branch = `step-${number}-${slug}`
const dir = `${parent}/${repoName}-${branch}`
// One port per step, so main on 3022 and step 4 on 3026 can run at the same time.
const port = 3022 + Number(number)

if (existsSync(dir)) {
  console.log(`\n${dir} already exists. Open it and carry on:\n\n  cd ${dir} && PORT=${port} bun run app\n`)
  process.exit(0)
}

const branchExists = (await run(['git', 'rev-parse', '--verify', branch])).code === 0
const add = branchExists
  ? ['git', 'worktree', 'add', dir, branch]
  : ['git', 'worktree', 'add', '-b', branch, dir]

const created = await run(add)
if (created.code !== 0) {
  console.error(created.err || created.out)
  process.exit(1)
}

// .env and node_modules are gitignored, so a new worktree starts without them.
if (existsSync(`${root}/.env`)) await Bun.write(`${dir}/.env`, Bun.file(`${root}/.env`))
await run(['bun', 'install'], dir)

console.log(`
Worktree ready.

  branch   ${branch}
  folder   ${dir}
  port     ${port}

  cd ${dir}
  PORT=${port} bun run app

Your main checkout is untouched, so you can run both at once and compare them
in two browser windows. When the step is done, put the write-up on main:

  cd ${root} && git checkout main
  # add learn/step-0${number}-${slug}.md, plus anything that confused you
  git commit -am "step ${number} write-up"
  cd ${dir} && git rebase main
`)
