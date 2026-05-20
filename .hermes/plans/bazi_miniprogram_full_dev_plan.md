# 八字便利店 - 完整开发计划

**基于 Agent 0 体检结果生成**
**计划文件**：.hermes/plans/bazi_miniprogram_full_dev_plan.md

---

## 目录

1. [页面开发计划](#1-页面开发计划)
2. [云函数开发计划](#2-云函数开发计划)
3. [大模型调用计划](#3-大模型调用计划)
4. [合规审查计划](#4-合规审查计划)
5. [GitHub 同步计划](#5-github-同步计划)
6. [测试计划](#6-测试计划)
7. [回滚方案](#7-回滚方案)

---

## 1. 页面开发计划

### 目标文件结构

```
miniprogram/
├── app.js
├── app.json           <- 更新：添加 pages/about, pages/form
├── app.wxss           <- 新增：全局样式
├── pages/
│   ├── index/         <- 重写：作为落地页（开始分析 + 关于项目）
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── form/          <- 新增：信息填写页
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── result/        <- 重写：结构化报告展示
│   │   ├── index.js   (rename from result.js)
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   └── about/         <- 新增：关于页
│       ├── index.js
│       ├── index.json
│       ├── index.wxml
│       └── index.wxss
└── components/
    ├── disclaimer/    <- 新增：免责声明组件
    │   ├── index.js
    │   ├── index.json
    │   ├── index.wxml
    │   └── index.wxss
    └── report-card/   <- 新增：报告卡片组件
        ├── index.js
        ├── index.json
        ├── index.wxml
        └── index.wxss
```

### 1.1 首页 (pages/index)

**当前状态**：部分完成，缺少页面配置
**操作**：
- 重写 index.wxml：落地页（非表单页）
  - 项目名：八字便利店
  - 副标题：传统干支文化学习工具
  - 按钮1：开始分析 → 跳转 pages/form/form
  - 按钮2：关于项目 → 跳转 pages/about/about
  - 底部免责声明
- 重写 index.js：移除表单逻辑，只保留导航
- 新增 index.json：页面配置（navigationBarTitleText 等）
- 保留 index.wxss

### 1.2 表单页 (pages/form) - 新增

**操作**：
- 创建 pages/form/ 目录及 4 个文件
- index.wxml 表单字段：
  - 阳历生日（date picker）- 必填
  - 出生时间（selector picker，子时~亥时）- 必填
  - 性别（radio）- 必填
  - 出生地（input）- 可选
  - 备注（textarea）- 可选（不提交给云函数，仅本地备注）
- index.js submit() 逻辑：
  - 校验必填项
  - 调用 wx.cloud.callFunction({ name: 'analyzeBazi', data: { birthday, hour, gender, location } })
  - loading: wx.showLoading
  - 成功：wx.navigateTo 跳转到 pages/result/result，传递完整 res.result 对象（JSON.stringify + encodeURIComponent）
  - 失败：wx.showToast 显示 res.result.report.title

### 1.3 结果页 (pages/result) - 重写

**操作**：
- 将 result.js 改为标准页面结构（index.js 同名文件放 result 目录）
- index.wxml 展示：
  - 标题：report.title
  - 内容：report.summary
  - 免责声明：report.disclaimer（单独区块，高亮样式）
  - 返回首页按钮
- index.js onLoad：解析 JSON.stringify 后的 result 对象，设置 data

### 1.4 关于页 (pages/about) - 新增

**操作**：
- 创建 pages/about/ 目录及 4 个文件
- index.wxml 内容：
  - 项目来源（bazi-skill → 微信小程序）
  - bazi-skill 来源说明（MIT License，jinchenma94）
  - MIT License 说明
  - 非预测、非决策建议声明
  - 版本号（v1.0.0）
- 使用 components/disclaimer/ 组件

### 1.5 组件

**components/disclaimer/**
- index.wxml：固定免责声明文本
- 样式：字号小、颜色淡、居中

**components/report-card/**
- index.wxml：报告卡片容器
- 接收 properties：title, content
- 样式：卡片阴影、圆角

### 1.6 app.json 更新

```json
{
  "pages": [
    "pages/index/index",
    "pages/form/form",
    "pages/result/result",
    "pages/about/about"
  ],
  "window": {
    "navigationBarBackgroundColor": "#2D6A4F",
    "navigationBarTitleText": "八字便利店",
    "navigationBarTextStyle": "white"
  }
}
```

### 1.7 app.wxss 新增

- 全局样式变量（CSS custom properties）：
  - --color-primary: #2D6A4F（深青绿）
  - --color-accent: #C9A84C（暖金）
  - --color-bg: #FDF6E3（米白）
- 全局字体、行距规范

---

## 2. 云函数开发计划

### 目标：保持当前 index.js 核心逻辑，修复问题

### 2.1 当前状态（已良好）

- exports.main 正确
- 环境变量读取正确
- http/https 调用正确
- 错误码规范
- BANNED_PATTERNS 正确
- 不打印密钥

### 2.2 修复项

**无阻塞性修复**，但需优化：
- 确保 JSON 输出格式更稳定（prompt 强调只输出纯 JSON）
- 考虑添加 `baziCultureNote` 和 `fiveElementsNote` 字段到 report 结构（可选，不影响核心功能）

### 2.3 不修改项

- 不修改错误码规范
- 不修改 BANNED_PATTERNS
- 不添加 console.log 调试
- 不硬编码 API Key

---

## 3. 大模型调用计划

### 3.1 当前状态

- Provider: MiniMax-M2.7
- Base URL: https://api.minimax.chat/v1
- 调用方式：OpenAI-compatible /chat/completions

### 3.2 优化项

- prompt 优化：确保大模型只输出纯 JSON（三字段：title/summary/disclaimer）
- 避免 markdown 代码块包裹（用正则在 buildReport 中 strip）
- temperature: 0.6（适中，避免过于发散）
- max_tokens: 900

---

## 4. 合规审查计划

### 4.1 审查范围

- [ ] index.wxml - 所有按钮文案、placeholder
- [ ] about.wxml - 来源说明、免责声明
- [ ] 云函数 system prompt - 禁止词汇
- [ ] 云函数 user prompt - 请求语句
- [ ] README.md - 项目描述
- [ ] NOTICE - 版权声明
- [ ] components/disclaimer - 免责声明文本

### 4.2 禁止词清单

```
算命大师 | 改运 | 发财 | 暴富 | 死亡预测 | 疾病判断
灾祸判断 | 婚恋必然 | 投资建议 | 医疗建议 | 恐吓性表达
诱导付费 | 化解 | 转运 | 保证 | 必然 | 一定 | 必定
```

### 4.3 必须保留文案

```
本内容仅供传统干支文化学习与娱乐参考，不构成医疗、投资、婚姻、职业或其他现实决策依据。
```

### 4.4 输出

docs/01_compliance_review.md

---

## 5. GitHub 同步计划

### 5.1 分支策略

```
master (保护分支，不直接推送)
  └── feature/miniprogram-ai-bazi (功能分支，所有开发在此完成)
        └── PR → master (Codex 审查通过后合并)
```

### 5.2 操作步骤

```bash
# 1. 确保 master 最新
git checkout master
git pull origin master

# 2. 创建功能分支
git checkout -b feature/miniprogram-ai-bazi

# 3. 开发完成后提交
git add .
git commit -m "feat: complete bazi miniprogram scaffold"

# 4. 推送功能分支
git push -u origin feature/miniprogram-ai-bazi

# 5. 创建 PR（使用 gh CLI）
gh pr create \
  --title "feat: bazi miniprogram v1.0.0" \
  --body "完整的八字便利店微信小程序，包含云函数调用 MiniMax 大模型。" \
  --base master

# 6. Codex 审查通过后合并
# 手动合并或 gh pr merge
```

### 5.3 禁止操作

- 禁止强推 master
- 禁止合并未审查代码
- 禁止提交 .env.local / project.private.config.json / sk-*

---

## 6. 测试计划

### 6.1 本地检查脚本 (scripts/check-project.js)

```javascript
// 检查项：
// 1. app.json 中所有页面路径对应的文件是否存在
// 2. 云函数 index.js 不包含 sk- / LLM_API_KEY= / TENCENTCLOUD_SECRET
// 3. .gitignore 包含 .env 和 project.private.config.json
// 4. 所有 .js 文件不含 console.log(process.env)
// 5. package.json 依赖合理
```

### 6.2 手动验收清单 (docs/03_manual_acceptance.md)

**表单页**
- [ ] 不选生日时点提交 → Toast 提示"请选择生日"
- [ ] 选必填项后提交 → loading 显示
- [ ] 网络错误时 → Toast 显示"网络错误"

**结果页**
- [ ] 正常返回时 → 显示标题 + 内容 + 免责声明
- [ ] 返回首页按钮可用

**关于页**
- [ ] 显示项目来源
- [ ] 显示 MIT License 说明
- [ ] 显示非预测声明

**云函数**
- [ ] 缺少环境变量 → 返回 ok:false, report.title 说明 MISSING_ENV
- [ ] 正常输入 → 返回 ok:true, report.{title,summary,disclaimer}
- [ ] 大模型返回禁用词 → 被替换为脱敏文本

**安全**
- [ ] GitHub 仓库不包含 .env.local
- [ ] GitHub 仓库不包含 sk- 字符串
- [ ] 云函数日志不打印 API Key

---

## 7. 回滚方案

### 7.1 Git 回滚

```bash
# 查看最近 5 次提交
git log --oneline -5

# 回滚到上一个可工作版本
git reset --hard <commit-hash>

# 强制推送到功能分支（不推荐直接推 master）
git push --force-with-lease origin feature/miniprogram-ai-bazi
```

### 7.2 文件级回滚

```bash
# 回滚单个文件
git checkout <commit-hash> -- <file-path>

# 示例：回滚云函数
git checkout HEAD~1 -- cloudfunctions/analyzeBazi/index.js
```

### 7.3 云函数回滚

微信开发者工具云函数面板 → analyzeBazi → 版本历史 → 恢复到上一版本

### 7.4 GitHub PR 回滚

合并后若发现问题 → 创建新的 revert commit 或直接回滚 master

---

## 计划执行顺序

| 步骤 | Agent | 任务 |
|------|-------|------|
| 1 | Agent 2 | 前端开发（所有页面 + 组件） |
| 2 | Agent 3 | 云函数审查（确认无阻塞问题） |
| 3 | Agent 4 | 合规审查（文案审查） |
| 4 | Agent 5 | 测试脚本 + 验收清单 |
| 5 | Agent 6 | GitHub 分支 + PR |
| 6 | Agent 7 | Codex 最终审查 |
| 7 | Agent 8 | 收尾报告 |
