#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  npm run sync

What it does:
  Switches to main, fetches the latest origin/main, and fast-forwards main.
  If you have local changes, it stashes them first and reapplies them on main.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

is_dirty() {
  ! git diff --quiet ||
    ! git diff --cached --quiet ||
    [[ -n "$(git ls-files --others --exclude-standard)" ]]
}

need_cmd git

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

current_branch="$(git branch --show-current)"
if [[ -z "$current_branch" ]]; then
  echo "You are not on a branch. Please switch to a branch first." >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Missing git remote: origin" >&2
  exit 1
fi

stash_name=""
if is_dirty; then
  stash_name="collab-sync auto-stash $(date '+%Y-%m-%d %H:%M:%S')"
  echo "Local changes found. Stashing them temporarily..."
  git stash push -u -m "$stash_name" >/dev/null
fi

echo "Fetching latest main..."
git fetch origin main

if [[ "$current_branch" != "main" ]]; then
  echo "Switching from $current_branch to main..."
  if git show-ref --verify --quiet refs/heads/main; then
    git switch main
  else
    git switch -c main --track origin/main
  fi
else
  echo "Already on main."
fi

echo "Updating main..."
git merge --ff-only origin/main

if [[ -n "$stash_name" ]]; then
  echo "Reapplying your local changes..."
  if ! git stash pop; then
    echo
    echo "Your latest code was synced, but the stashed changes need conflict resolution." >&2
    echo "After resolving files, ask Codex to help finish the conflict resolution." >&2
    exit 1
  fi
fi

echo
echo "Done. main is synced with origin/main."
