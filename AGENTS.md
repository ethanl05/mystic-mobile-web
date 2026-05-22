# Codex Project Instructions

This repository supports one-sentence Git collaboration commands for the user and their collaborator.

## Direct Collaboration Commands

When the user asks any of these in Chinese or English:

- `同步代码`
- `拉最新`
- `更新到最新版本`
- `sync code`
- `pull latest`

Do not explain Git first. Run:

```bash
npm run sync
```

Then summarize whether the local branch is now up to date. If conflicts happen, explain the conflicted files and help resolve them.

When the user asks any of these:

- `发布代码：<说明>`
- `推送代码：<说明>`
- `提交并推送：<说明>`
- `把当前代码发出去`
- `push code: <description>`
- `publish code: <description>`

Do not ask them to run terminal commands. Use the description after the colon as the commit/PR title. If there is no description, infer a short title from the current diff. Then run:

```bash
npm run push-code -- "<title>"
```

This command creates a work branch when needed, commits current code, pushes it, and opens a GitHub Pull Request.

## Safety Rules

- Before publishing, inspect `git status --short` and avoid mixing unrelated changes when the user clearly asked for only one scope.
- Never commit `.env`, secrets, keys, or local credential files.
- If GitHub CLI is not authenticated, handle the login flow for the user and show the browser/device-code step when needed.
- If a command fails because of stale Git lock files from a crashed process, verify no active Git write process is running before removing the stale lock.
- After publishing, report the branch, commit, PR URL, and GitHub Actions status when available.

## User-Facing Phrase

Tell the user they can use:

- `同步代码`
- `发布代码：这里写这次改了什么`
