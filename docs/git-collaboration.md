# 双人 GitHub 协作机制

本文档用于这个仓库的双人协同开发。目标很简单：`main` 始终保持可运行，所有功能和修复都通过分支、Pull Request、代码审查和自动测试进入 `main`。

## 仓库信息

- GitHub 远端：`https://github.com/ethanl05/mystic-mobile-web.git`
- 默认稳定分支：`main`
- 协作方式：每个任务一个分支，每个分支一个 Pull Request，至少另一位开发者确认后再合并

## 最简 Codex 指令

如果你正在和 Codex 对话，日常只需要发送一句话：

```text
同步代码
```

或者：

```text
发布代码：这里写这次改了什么
```

Codex 会读取仓库根目录的 `AGENTS.md`，自动运行底层同步或发布流程。也就是说，你和合作的人不需要手动打开终端敲 Git 命令。

## 底层命令

如果你确实想手动运行，底层命令是：

```bash
npm run sync
npm run push-code -- "这次修改说明"
```

`npm run sync` 会拉取最新 `main`，并把当前分支更新到最新基础上。如果你本地有未提交修改，它会先临时保存，更新后再放回来。

`npm run push-code -- "这次修改说明"` 会：

- 如果当前在 `main`，自动创建一个 `work/...` 分支
- 自动暂存当前代码
- 拦截 `.env`、密钥等敏感文件
- 创建提交
- 推送到 GitHub
- 自动创建 Pull Request

以后可以把完整 Git 流程当作底层机制。实际协作时，优先使用上面两个命令。

## GitHub 一次性设置

仓库管理员在 GitHub 网页上完成这些设置：

1. 邀请第二位开发者：`Settings -> Collaborators and teams -> Add people`，权限给 `Write`。
2. 保护 `main` 分支：`Settings -> Branches -> Add branch protection rule`，分支名填 `main`。
3. 建议勾选：
   - `Require a pull request before merging`
   - `Require approvals`，数量设为 `1`
   - `Require status checks to pass before merging`
   - 选择状态检查 `test`
   - `Require conversation resolution before merging`
   - `Block force pushes`
   - `Do not allow bypassing the above settings`
4. 合并方式建议只保留 `Squash merge`：`Settings -> General -> Pull Requests`。

如果 `test` 状态检查暂时没有出现在 GitHub 下拉框里，先把本次新增的 `.github/workflows/pr-check.yml` 推送到 `main`，等 GitHub Actions 至少运行一次后，再回来勾选 `test`。

## 分支规则

`main` 只放稳定代码，不直接在 `main` 上开发。

新任务从最新 `main` 拉一个分支：

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/brief-topic
```

分支命名建议：

- 新功能：`feat/bazi-report-history`
- 修复：`fix/payment-callback`
- UI 调整：`ui/yijing-result-card`
- 文档或流程：`docs/git-collaboration`

如果两个人同时改同一块代码，先在聊天里约定谁负责哪个文件或哪个页面，避免无意义冲突。

## 日常开发流程

1. 开始前同步：

```bash
git switch main
git pull --ff-only origin main
```

2. 新建任务分支：

```bash
git switch -c feat/your-task-name
```

3. 小步提交：

```bash
git add path/to/changed-file
git commit -m "feat: add yijing result sharing"
```

4. 推送分支：

```bash
git push -u origin feat/your-task-name
```

5. 在 GitHub 打开 Pull Request：
   - base 选择 `main`
   - compare 选择自己的任务分支
   - 填写 PR 模板
   - 指定另一位开发者 Review

6. 通过检查和审查后合并：
   - 使用 `Squash merge`
   - 删除远端分支
   - 本地回到 `main` 并同步

```bash
git switch main
git pull --ff-only origin main
git branch -d feat/your-task-name
```

## 提交信息约定

使用简短英文前缀，后面可以写中文：

- `feat: add bazi free summary`
- `fix: correct yijing moving line label`
- `ui: polish mobile result spacing`
- `docs: add git collaboration workflow`
- `test: cover payment callback`
- `chore: update dependencies`

每次提交只做一类事情。不要把 UI、支付、文档、重构混在同一个提交里。

## PR 合并标准

一个 PR 合并前需要满足：

- 代码只解决当前 PR 的目标
- 自动检查通过
- 至少一位协作者 Review 通过
- UI 改动附截图或录屏
- 涉及环境变量时只更新 `.env.local.example`，不提交 `.env.local`
- 涉及付费、额度、AI 调用、支付回调时写清楚验证方式

## 冲突处理

当 GitHub 显示冲突时，在本地处理：

```bash
git fetch origin
git switch feat/your-task-name
git rebase origin/main
```

如果出现冲突：

1. 打开冲突文件，保留正确版本。
2. 确认功能仍然符合当前 PR 目标。
3. 标记已解决并继续：

```bash
git add path/to/conflicted-file
git rebase --continue
```

如果冲突很多，不要硬合。两个人先约定最终逻辑，再继续处理。

## 禁止事项

- 不直接向 `main` 推送功能代码
- 不把 `.env.local`、密钥、支付回调密钥提交进仓库
- 不在共享分支上使用 `git push --force`，除非两个人明确同意
- 不在一个 PR 里塞入多个无关目标
- 不把生成的备份 zip、大型临时文件继续加入版本库

## 推荐节奏

- 每天开始开发前同步 `main`
- 每个 PR 尽量控制在半天到一天内可以 Review
- 大功能先拆成 2 到 4 个小 PR
- 合并后及时通知另一位开发者同步 `main`
