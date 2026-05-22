#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  npm run push-code -- "short description of your change"

What it does:
  Stages your current code, commits it, pushes a work branch, and opens a GitHub PR.
  If you are on main, it creates a new work branch automatically.
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

make_slug() {
  local slug
  slug="$(printf '%s' "$1" |
    tr '[:upper:]' '[:lower:]' |
    sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g' |
    cut -c 1-48)"
  if [[ -z "$slug" ]]; then
    slug="change"
  fi
  printf '%s' "$slug"
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

branch="$(git branch --show-current)"
if [[ -z "$branch" ]]; then
  echo "You are not on a branch. Please switch to a branch first." >&2
  exit 1
fi

if [[ "$branch" == "main" || "$branch" == "master" ]]; then
  slug="$(make_slug "$message")"
  branch="work/$(date '+%Y%m%d-%H%M')-$slug"
  echo "Creating work branch: $branch"
  git fetch origin main
  git merge --ff-only origin/main
  git switch -c "$branch"
fi

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

echo "Committing..."
git commit -m "$message"

echo "Pushing $branch..."
git push -u origin "$branch"

existing_pr="$(gh pr view --head "$branch" --json url -q .url 2>/dev/null || true)"
if [[ -n "$existing_pr" ]]; then
  echo
  echo "PR already exists: $existing_pr"
  exit 0
fi

echo "Opening GitHub PR..."
pr_url="$(gh pr create \
  --base main \
  --head "$branch" \
  --title "$message" \
  --body "## 这次改了什么

- $message

## 验证方式

- GitHub Actions 会自动运行 test。
")"

echo
echo "Done. PR: $pr_url"
