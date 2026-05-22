# 协作开发指南

这个仓库采用双人 GitHub 协作流程：所有开发从 `main` 拉新分支，完成后通过 Pull Request 合并回 `main`。

如果你正在和 Codex 对话，最简单的方式不是打开终端，而是直接发送：

```text
同步代码
发布代码：这里写这次改了什么
```

Codex 会根据本仓库的 [AGENTS.md](AGENTS.md) 自动执行同步或发布流程。

底层对应的两个命令是：

```bash
npm run sync
npm run push-code -- "这次修改说明"
```

`sync` 用来拉取最新版本；`push-code` 会自动提交当前代码、推送工作分支，并创建 GitHub Pull Request。

请先阅读完整流程：[docs/git-collaboration.md](docs/git-collaboration.md)。

最短工作流：

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/your-task-name
```

完成修改后：

```bash
git add path/to/changed-file
git commit -m "feat: describe your change"
git push -u origin feat/your-task-name
```

然后在 GitHub 上创建 Pull Request，请另一位开发者 Review，通过自动检查后使用 `Squash merge` 合并。
