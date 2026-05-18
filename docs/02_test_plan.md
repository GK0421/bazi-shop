# 测试计划 (Agent 5)

**创建时间**：2026-05-18

---

## 一、自动化检查

### scripts/check-project.js

运行方式：
```bash
cd D:\bazi-miniprogram-env\02_workspace\bazi-miniprogram
node scripts/check-project.js
```

检查项：

| # | 检查项 | 期望 |
|---|--------|------|
| 1 | app.json 存在 | true |
| 2 | app.json pages 数组非空 | true |
| 3 | 每个页面 4 个文件都存在（js/json/wxml/wxss） | 全部 true |
| 4 | cloudfunctions/analyzeBazi/index.js 存在 | true |
| 5 | cloudfunctions/analyzeBazi/package.json 存在 | true |
| 6 | 所有 .js 文件不含 sk-[key] 字符串 | 0 处 |
| 7 | 所有 .js 文件不含 LLM_API_KEY=sk- | 0 处 |
| 8 | 所有 .js 文件不含 TENCENTCLOUD_SECRET | 0 处 |
| 9 | .gitignore 包含 .env | true |
| 10 | .gitignore 包含 project.private.config | true |
| 11 | 云函数 index.js 不打印 process.env | true |
| 12 | 云函数 index.js 不打印 API Key | true |
| 13 | 云函数 index.js 不打印 context | true |
| 14 | app.js 包含 wx.cloud.init | true |
| 15 | components/disclaimer 存在 | true |
| 16 | components/report-card 存在 | true |

退出码：0 = 全部通过，1 = 存在失败项

---

## 二、手动验收清单

详见 `docs/03_manual_acceptance.md`

---

## 三、云函数单元测试（模拟）

### 3.1 缺少环境变量

**输入**：无环境变量
**期望返回**：
```json
{
  "ok": false,
  "report": { "title": "配置缺失", "summary": "请先配置..." }
}
```

### 3.2 缺少必填字段

**输入**：`{ birthday: '', hour: '', gender: '' }`
**期望返回**：
```json
{
  "ok": false,
  "report": { "title": "信息不完整", "summary": "请填写生日、出生时辰和性别。" }
}
```

### 3.3 正常输入

**输入**：`{ birthday: '1990-01-01', hour: 23, gender: '男', location: '北京' }`
**期望返回**：
```json
{
  "ok": true,
  "provider": "minimax",
  "model": "MiniMax-M2.7",
  "report": {
    "title": "...",
    "summary": "...",
    "disclaimer": "本内容仅用于..."
  }
}
```

### 3.4 BANNED_WORDS 过滤

**输入**：大模型输出包含"发财"
**期望**：输出中"发财"被替换为"相关现实判断"

---

## 四、微信开发者工具手动测试

详见 `docs/03_manual_acceptance.md`
