#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  npm run sync

What it does:
  Fetches the latest main branch and updates your current branch.
  If you have local changes, it stashes them first and reapplies them after sync.
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

branch="$(git branch --show-current)"
if [[ -z "$branch" ]]; then
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

if [[ "$branch" == "main" ]]; then
  echo "Updating main..."
  git merge --ff-only origin/main
else
  echo "Updating $branch on top of origin/main..."
  git rebase origin/main
fi

if [[ -n "$stash_name" ]]; then
  echo "Reapplying your local changes..."
  if ! git stash pop; then
    echo
    echo "Your latest code was synced, but the stashed changes need conflict resolution." >&2
    echo "After resolving files, run: git add <file> && git rebase --continue, if rebase is active." >&2
    exit 1
  fi
fi

echo
echo "Done. $branch is synced with origin/main."
