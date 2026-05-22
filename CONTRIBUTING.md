# 协作开发指南

这个仓库采用双人 GitHub 协作流程：所有开发从 `main` 拉新分支，完成后通过 Pull Request 合并回 `main`。

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
