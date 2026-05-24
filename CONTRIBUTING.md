# 协作开发指南

这个仓库现在采用单分支协作流程：两个人都在 `main` 上同步、修改、提交和推送。日常不再需要 Pull Request、Approve 或 Merge。

如果你正在和 Codex 对话，最简单的方式是直接发送：

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

`sync` 会切到 `main` 并拉取 `origin/main` 最新版本；`push-code` 会切到 `main`、自动暂存当前代码、拦截 `.env` 和常见密钥内容、提交并直接推送到 `origin/main`。

推荐节奏：

- 开始修改前先对 Codex 说：`同步代码`
- 修改完成后对 Codex 说：`发布代码：简短说明`
- 两个人尽量不要同时改同一块文件；如果要改同一页或同一模块，先在聊天里约定谁负责哪部分。
- 不提交 `.env.local`、API key、支付密钥、备份 zip 或 `node_modules`。
