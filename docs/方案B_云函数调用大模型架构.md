# 方案B：微信云函数调用大模型API 架构文档

## 1. 系统架构概览

```
┌─────────────────────────────────────────────────────────┐
│                   微信小程序前端                          │
│  miniprogram/                                           │
│  ├── pages/index/          # 首页（表单页）              │
│  ├── pages/result/         # 结果展示页                 │
│  └── app.js                # 全局逻辑                   │
└──────────────────────┬──────────────────────────────────┘
                       │ wx.cloud.callFunction()
                       │ (只传递：birthday, hour, gender, location)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              微信云函数 analyzeBazi                       │
│  cloudfunctions/analyzeBazi/                            │
│  ├── index.js              # 云函数入口                  │
│  ├── package.json                                        │
│  └── config.json           # 云函数配置（环境变量等）    │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS 请求
                       │ Authorization: Bearer <API_KEY>
                       ▼
┌─────────────────────────────────────────────────────────┐
│              大模型 API（Moonshot / OpenAI 等）          │
│  BASE_URL: https://api.moonshot.cn/v1                   │
│  MODEL: kimi-k2.5                                       │
└─────────────────────────────────────────────────────────┘
```

## 2. 数据流

1. 用户在小程序前端填写：生日、时辰、性别、出生地
2. 前端调用 `wx.cloud.callFunction({ name: 'analyzeBazi', data: {...} })`
3. 云函数接收参数，读取环境变量中的 API Key
4. 云函数构造 prompt，调用大模型 API
5. 大模型返回分析结果
6. 云函数附加免责声明，返回给前端
7. 前端展示结果页面

## 3. 安全要点

### 3.1 API Key 保护
- API Key 只存在于微信云函数环境变量中
- `process.env.LLM_API_KEY` 在云函数运行时读取
- 前端代码不包含任何 API Key
- `.env.local` 和 `04_secrets_local/` 不加入 Git

### 3.2 输入过滤
云函数需要对用户输入做基本过滤：
- 生日格式校验（YYYY-MM-DD）
- 时辰范围校验（0-23）
- 性别只能是「男」或「女」
- 出生地限制最大长度（100字符）

### 3.3 输出审查
- 云函数返回内容需检测是否包含违规承诺
- 以下内容禁止出现：
  - 医疗诊断、治疗建议
  - 投资建议、理财指导
  - 改运、化解、改名承诺
  - 死亡预测、灾难预警
- 如检测到违规内容，替换为标准免责声明

## 4. 提示词工程（SKILL.md 转换）

原始 `jinchenma94/bazi-skill` 内容需转换为：

### 4.1 System Prompt
将 SKILL.md 中的八字规则、格局判断、十神体系等作为 system prompt 基础。

### 4.2 知识片段
references/ 下的文件转为结构化知识：
- `classical-texts.md` → 古籍引用库
- `dayun-rules.md` → 大运规则
- `shichen-table.md` → 时辰地支对照
- `wuxing-tables.md` → 五行强度表

### 4.3 输出格式控制
在 system prompt 中要求模型输出固定格式，便于前端解析展示。

## 5. 微信云开发配置

### 5.1 环境变量（云函数控制台配置）
```
LLM_PROVIDER = moonshot
LLM_BASE_URL = https://api.moonshot.cn/v1
LLM_MODEL = kimi-k2.5
LLM_API_KEY = sk-xxxxxxxxxxxxxxxxxxxx  ← 真实 Key 在此填入
```

### 5.2 云函数目录结构
```
cloudfunctions/
└── analyzeBazi/
    ├── index.js
    └── package.json
```

### 5.3 前端调用示例
```javascript
wx.cloud.callFunction({
  name: 'analyzeBazi',
  data: {
    birthday: '1990-01-15',
    hour: 14,
    gender: '男',
    location: '北京'
  }
}).then(res => {
  if (res.result.success) {
    console.log(res.result.result);
  } else {
    console.error(res.result.error);
  }
});
```

## 6. 后续开发清单

- [ ] 开通微信小程序 AppID（如无测试号）
- [ ] 开通微信云开发环境
- [ ] 在云函数控制台配置环境变量
- [ ] 上传并部署 analyzeBazi 云函数
- [ ] 开发 miniprogram 前端页面
- [ ] 对接云函数调用
- [ ] 配置合法域名（云函数请求外网需配白名单）
- [ ] 测试并上线
