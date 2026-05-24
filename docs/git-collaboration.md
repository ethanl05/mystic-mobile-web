# 单分支 GitHub 协作机制

本文档用于这个仓库的双人协同开发。当前目标是降低使用难度：两个人都只围绕 `main` 工作，不再要求 Pull Request、Approve 或 Merge。

## 仓库信息

- GitHub 远端：`https://github.com/ethanl05/mystic-mobile-web.git`
- 共享分支：`main`
- 协作方式：同步 `main`，在 `main` 上修改，直接提交并推送 `origin/main`

## 最简 Codex 指令

如果你正在和 Codex 对话，日常只需要发送一句话：

```text
同步代码
```

或者：

```text
发布代码：这里写这次改了什么
```

Codex 会读取仓库根目录的 `AGENTS.md`，自动运行底层同步或发布流程。你和合作的人不需要手动打开终端敲 Git 命令。

## 底层命令

如果你确实想手动运行，底层命令是：

```bash
npm run sync
npm run push-code -- "这次修改说明"
```

`npm run sync` 会：

- 临时保存未提交修改
- 切到 `main`
- 拉取 `origin/main`
- 快进本地 `main`
- 把临时保存的修改重新放回 `main`

`npm run push-code -- "这次修改说明"` 会：

- 确保当前在 `main`
- 拉取并快进到最新 `origin/main`
- 自动暂存当前代码
- 拦截 `.env`、密钥文件和常见密钥内容
- 创建提交
- 直接推送到 `origin/main`

## 日常流程

1. 开始前对 Codex 说：

```text
同步代码
```

2. 修改功能或文案。

3. 完成后对 Codex 说：

```text
发布代码：简短说明这次改了什么
```

4. 另一位开发者继续工作前，也先说：

```text
同步代码
```

## 协作约定

- 两个人尽量不要同时改同一页、同一组件或同一个配置文件。
- 如果必须同时改同一块，先在聊天里约定边界，例如一个人改页面 UI，另一个人改 API 或测试。
- 小步提交，说明写清楚，例如 `发布代码：调整八字结果页分享按钮`。
- 如果同步或发布时出现冲突，让 Codex 继续处理冲突，不要手动乱改。

## 安全规则

- 不提交 `.env.local`、API key、支付密钥、数据库连接串或私钥。
- 涉及环境变量时，只更新 `.env.local.example`。
- 不提交备份 zip、大型临时文件、`node_modules` 或本地缓存。
- 不使用 `git push --force`。
- 公开仓库里不要写真实密钥、真实后台地址、真实支付回调密钥。

## GitHub 设置

为了支持单分支直接推送，`main` 不再要求 Pull Request Review。

仓库仍然保留 GitHub Actions：当 `main` 收到 push 后会自动运行测试。测试失败时，下一次应优先修复失败原因，再继续开发。
