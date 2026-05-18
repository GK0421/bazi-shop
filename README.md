# 八字便利店（bazi-shop）

微信小程序：八字分析与传统文化学习工具

**方案B**：微信云函数调用大模型 API（MiniMax-M2.7）

GitHub：https://github.com/GK0421/bazi-shop

## 项目结构

```
bazi-shop/
├── miniprogram/              # 小程序前端
│   ├── pages/index/          # 表单页
│   └── pages/result/         # 结果展示页
├── cloudfunctions/           # 微信云函数
│   └── analyzeBazi/          # 八字分析云函数
├── docs/                     # 架构文档
├── scripts/                  # 工具脚本
├── .gitignore
├── README.md
├── LICENSE（MIT）
└── NOTICE
```

## 技术架构

- **前端**：微信小程序（miniprogram）
- **后端**：微信云函数（Cloud Functions）
- **大模型**：MiniMax-M2.7（通过云函数环境变量保护 API Key）
- **API Key**：仅存于微信云函数环境变量，不写入前端代码

## 快速开始

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目目录：`D:\bazi-miniprogram-env\02_workspace\bazi-miniprogram`
3. 开通云开发环境（点击「云开发」按钮）
4. 在云函数 `analyzeBazi` 的设置中配置环境变量：
   - `LLM_PROVIDER = minimax`
   - `LLM_BASE_URL = https://api.minimax.chat/v1`
   - `LLM_MODEL = MiniMax-M2.7`
   - `LLM_API_KEY = 你的 MiniMax Token`
5. 上传并部署云函数
6. 编译运行

## 环境变量

配置在微信云函数控制台，详见 `docs/方案B_云函数调用大模型架构.md`。

## 注意事项

- API Key 严禁写入前端代码
- `.env.local` 和 `project.private.config.json` 不得提交 Git
- 八字分析仅供娱乐和文化学习参考，不构成专业建议

## 许可证

MIT License，详见 LICENSE 与 NOTICE。
