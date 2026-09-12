#!/usr/bin/env bash
#
# Evals by example — one-line install.
#
#   curl -fsSL https://destinio.github.io/evals-by-example/install.sh | bash
#
# Clones the repo, installs dependencies, and walks you through setup.
# Read it first if you like: https://github.com/destinio/evals-by-example/blob/main/scripts/install.sh
#
# Optional: EVALS_DIR=my-folder to clone somewhere other than ./evals-by-example

set -euo pipefail

REPO="https://github.com/destinio/evals-by-example.git"
DIR="${EVALS_DIR:-evals-by-example}"

bold=$'\033[1m'; green=$'\033[32m'; yellow=$'\033[33m'; red=$'\033[31m'; dim=$'\033[2m'; reset=$'\033[0m'
say()  { printf '%s\n' "$*"; }
ok()   { printf '  %s✓%s %s\n' "$green" "$reset" "$*"; }
warn() { printf '  %s!%s %s\n' "$yellow" "$reset" "$*"; }
die()  { printf '\n  %s✗%s %s\n\n' "$red" "$reset" "$*"; exit 1; }

say ""
say "  🐶 ${bold}Evals by example${reset}"
say "  ${dim}learn LLM evals by fixing an app that's quietly lying to its customers${reset}"
say ""

# ------------------------------------------------------------------ prerequisites

command -v git >/dev/null 2>&1 || die "git is required — install it, then run this again."
ok "git"

if ! command -v bun >/dev/null 2>&1; then
  # Bun's installer puts it here but a fresh shell may not have it on PATH yet.
  if [ -x "$HOME/.bun/bin/bun" ]; then
    export PATH="$HOME/.bun/bin:$PATH"
  else
    say ""
    warn "Bun isn't installed. This project runs on Bun 1.4+. Install it with:"
    say ""
    say "      curl -fsSL https://bun.com/install | bash"
    say ""
    say "  then open a new terminal and run this installer again."
    say ""
    exit 1
  fi
fi
ok "bun $(bun --version)"

# ------------------------------------------------------------------ clone

if [ -e "$DIR" ]; then
  die "$DIR already exists. Remove it, or pick another folder: EVALS_DIR=somewhere-else"
fi

say ""
say "  cloning into ${bold}$DIR${reset}…"
git clone --quiet "$REPO" "$DIR"
ok "cloned"

cd "$DIR"

# Your work goes on your own branch, so main stays clean for pulling course updates.
git switch --quiet -c my-course
ok "on branch my-course (main stays clean for updates)"

# ------------------------------------------------------------------ setup

say ""
# `curl | bash` leaves stdin attached to the pipe, so setup's questions would get
# nothing. Hand it the terminal instead, when there is one.
if [ -r /dev/tty ] && (exec </dev/tty) 2>/dev/null; then
  bun run --silent setup </dev/tty || true
else
  bun install --silent
  bun run --silent setup --check || true
  say ""
  warn "No terminal to ask for API keys. Finish with:  cd $DIR && bun run setup"
fi

say ""
say "  ${bold}Next${reset}"
say "    cd $DIR"
say "    bun run app          ${dim}# http://localhost:3022 — click Rufus${reset}"
say ""
say "  The course: https://destinio.github.io/evals-by-example/"
say ""
