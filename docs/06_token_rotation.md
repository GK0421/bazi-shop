# Token 轮换指南

**生成时间**：2026-05-19

---

## 当前状态

云函数 `analyzeBazi` 已将你的 MiniMax Token 作为 fallback 内嵌在代码中：

```
Token: sk-cp-dRJYOdaBlHFGfZC6TBjj9NYPFrkqL0Q1lXLRgXUHyjtUrMcRPodcZVoxQb747-YBPoX0xDu5FnL1nL-EEhbha4mCU863HUnZCwvb86OW4huEpSQtULRCJHU
```

**Token 已通过 GitHub commit `a218a8f` 推送到了 `feature/miniprogram-ai-bazi` 分支。**

---

## ⚠️ 安全风险

该 Token 在以下位置暴露：
- Git commit `a218a8f` 的 diff（可被任何人查看）
- GitHub PR #1 的 commit 历史

**请在确认小程序能正常运行后，立即轮换 Token。**

---

## Token 轮换步骤

### 步骤 1：在 MiniMax 控制台生成新 Token

1. 打开 https://platform.minimax.io/ 并登录
2. 进入 API Keys 页面
3. 点击 "Create New Secret Key"
4. 复制新 Token（格式：`sk-cp-...`）

### 步骤 2：在微信云开发控制台更新环境变量

1. 打开 https://console.cloud.miniprogram.com/
2. 进入环境 `cloud1-d1gwyutj2d122bc22`
3. 左侧菜单 → 云函数 → `analyzeBazi` → 配置
4. 找到 `LLM_API_KEY`，填入新 Token
5. 保存

### 步骤 3：在本地代码中也更新 fallback

项目根目录更新云函数：

```javascript
// 文件：cloudfunctions/analyzeBazi/index.js
// 第 26 行，fallback 值替换为新 Token
```

### 步骤 4：从 GitHub 历史中移除旧 Token

在确认 Token 轮换完成后，执行以下命令（或在 GitHub 设置中重写历史）：

```bash
# 在本地仓库中彻底移除旧 Token
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch cloudfunctions/analyzeBazi/index.js' \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

> 注意：这会重写 Git 历史，需要所有协作者重新克隆仓库。

### 步骤 5：验证旧 Token 已失效

在 MiniMax 控制台禁用或删除旧 Token。

---

## 长期最佳实践

将 Token 放在**云函数环境变量**中（不在代码里），代码只读 `process.env.LLM_API_KEY`。

这样即使代码被推送，Token 也不会在 GitHub 暴露。

如果腾讯云 CLI 支持，可使用：

```bash
tcb fn envset analyzeBazi --key LLM_API_KEY --value <新Token>
```
