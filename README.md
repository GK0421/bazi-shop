# bazi-miniprogram

微信小程序：八字分析与传统文化学习工具（方案B：微信云函数调用大模型API）

## 项目结构

```
bazi-miniprogram/
├── miniprogram/          # 小程序前端
├── cloudfunctions/       # 微信云函数
├── docs/                 # 文档
├── scripts/              # 工具脚本
├── .gitignore
├── README.md
├── LICENSE
└── NOTICE
```

## 快速开始

1. 安装微信开发者工具
2. 导入本项目（目录：`D:\bazi-miniprogram-env\02_workspace\bazi-miniprogram`）
3. 开通云开发环境
4. 配置云函数环境变量（API Key）
5. 本地调试 / 上传云函数

## 环境变量

复制 `project.private.config.json.example` 为 `project.private.config.json`，填入真实 AppID。

API Key 只允许存放在微信云函数环境变量中，禁止写入前端代码。

## 许可证

本项目基于 MIT License，详见 LICENSE 和 NOTICE。
