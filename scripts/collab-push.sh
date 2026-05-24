#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  npm run push-code -- "short description of your change"

What it does:
  Switches to main when needed, stages your current code, commits it, and pushes directly to origin/main.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

message="$*"
if [[ -z "$message" ]]; then
  echo "Please provide a short change description." >&2
  echo 'Example: npm run push-code -- "调整八字结果页样式"' >&2
  exit 1
fi

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing command: $1" >&2
    exit 1
  fi
}

is_sensitive_path() {
  local path="$1"
  case "$path" in
    .env|.env.*|*.env|*.env.*|*.pem|*.key|*.p12|*.mobileprovision)
      case "$path" in
        .env.local.example|*.env.example|*.env.local.example)
          return 1
          ;;
      esac
      return 0
      ;;
  esac
  return 1
}

is_dirty() {
  ! git diff --quiet ||
    ! git diff --cached --quiet ||
    [[ -n "$(git ls-files --others --exclude-standard)" ]]
}

ensure_on_updated_main() {
  local current_branch stash_name
  current_branch="$(git branch --show-current)"
  if [[ -z "$current_branch" ]]; then
    echo "You are not on a branch. Please switch to a branch first." >&2
    exit 1
  fi

  echo "Fetching latest main..."
  git fetch origin main

  if [[ "$current_branch" != "main" ]]; then
    stash_name=""
    if is_dirty; then
      stash_name="collab-push move-to-main $(date '+%Y-%m-%d %H:%M:%S')"
      echo "Local changes found on $current_branch. Moving them to main..."
      git stash push -u -m "$stash_name" >/dev/null
    fi

    if git show-ref --verify --quiet refs/heads/main; then
      git switch main
    else
      git switch -c main --track origin/main
    fi

    git merge --ff-only origin/main

    if [[ -n "$stash_name" ]]; then
      echo "Reapplying your local changes on main..."
      if ! git stash pop; then
        echo "Your changes are on main but need conflict resolution before publishing." >&2
        exit 1
      fi
    fi
    return
  fi

  if ! git merge-base --is-ancestor origin/main HEAD; then
    stash_name=""
    if is_dirty; then
      stash_name="collab-push auto-stash $(date '+%Y-%m-%d %H:%M:%S')"
      echo "Local changes found. Stashing them before updating main..."
      git stash push -u -m "$stash_name" >/dev/null
    fi

    git merge --ff-only origin/main

    if [[ -n "$stash_name" ]]; then
      echo "Reapplying your local changes..."
      if ! git stash pop; then
        echo "main was updated, but your changes need conflict resolution before publishing." >&2
        exit 1
      fi
    fi
  else
    echo "main already contains origin/main."
  fi
}

need_cmd git
need_cmd gh

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "GitHub CLI is not logged in." >&2
  echo "Run: gh auth login -h github.com" >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Missing git remote: origin" >&2
  exit 1
fi

ensure_on_updated_main

echo "Staging current code..."
git add -A

staged_paths_file="$(mktemp)"
trap 'rm -f "$staged_paths_file"' EXIT
git diff --cached --name-only >"$staged_paths_file"

if [[ ! -s "$staged_paths_file" ]]; then
  echo "No code changes to push."
  exit 0
fi

blocked_paths=()
while IFS= read -r path; do
  if is_sensitive_path "$path"; then
    blocked_paths+=("$path")
  fi
done <"$staged_paths_file"

if [[ "${#blocked_paths[@]}" -gt 0 ]]; then
  echo "Refusing to commit sensitive files:" >&2
  printf '  %s\n' "${blocked_paths[@]}" >&2
  git restore --staged -- "${blocked_paths[@]}" || true
  exit 1
fi

secret_pattern='sk-[A-Za-z0-9]{16,}|AI_API''_KEY=[^[:space:]]+|PRIVATE'' KEY|CLIENT''_SECRET|ACCESS''_TOKEN|DATABASE''_URL=postgresql://[^[:space:]]+@'
if git diff --cached --no-ext-diff | grep -E "$secret_pattern" >/dev/null; then
  echo "Refusing to commit because the staged diff appears to contain a secret or credential." >&2
  echo "Remove the secret from code and keep it in .env.local or GitHub/Vercel environment variables." >&2
  exit 1
fi

echo "Committing..."
git commit -m "$message"

echo "Pushing main..."
git push origin main

echo
echo "Done. main was pushed to origin/main."
