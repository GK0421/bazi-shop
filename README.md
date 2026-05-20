# 今日人设签 Vibe Card

这是一个已经切换为抖音小游戏结构的 `今日人设签 Vibe Card` 项目，代码位于 `D:\Develop\bazi-shop`，并连接到 GitHub 仓库 `https://github.com/GK0421/bazi-shop`。

## 当前主入口

根据抖音开放平台小游戏开发文档，小游戏项目的必要文件是根目录下的：

- `game.js`
- `game.json`
- `project.config.json`

本仓库已经按这个结构调整完成，当前主入口为：

- [game.js](D:\Develop\bazi-shop\game.js)
- [game.json](D:\Develop\bazi-shop\game.json)
- [project.config.json](D:\Develop\bazi-shop\project.config.json)

## 目录说明

- [game](D:\Develop\bazi-shop\game): 抖音小游戏前端源码，基于 Canvas 直接渲染
- [backend](D:\Develop\bazi-shop\backend): 本地 Node.js API，用于安全调用大模型
- [douyin-miniprogram](D:\Develop\bazi-shop\douyin-miniprogram): 旧的抖音小程序版本，保留作参考
- [miniprogram](D:\Develop\bazi-shop\miniprogram): 原微信小程序代码
- [cloudfunctions](D:\Develop\bazi-shop\cloudfunctions): 原微信云函数代码

## 本地开发

1. 安装依赖

```powershell
cd D:\Develop\bazi-shop
npm install
```

2. 启动本地 API

```powershell
npm run dev:api
```

3. 用抖音开发者工具打开根目录

```text
D:\Develop\bazi-shop
```

4. 在开发者工具里选择“小游戏”导入方式

## 当前玩法

小游戏版不是页面表单，而是一个竖屏、单画布的轻内容体验：

- `今日人设签 Vibe Card` 品牌化首页
- 年/月/日/时的触控步进器
- 性别与出生地的标签选择
- 人设签生成加载动画
- 适合一屏看完的短卡结果

## 环境变量

后端支持以下变量：

- `LLM_API_KEY`
- `MINIMAX_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
- `PORT`

可复制 [backend/.env.example](D:\Develop\bazi-shop\backend\.env.example) 为 `backend/.env` 后填写。

## AppID

当前项目已配置你的抖音小游戏 `AppID`：

- `ttf41382ae6a74c90b02`

已同步写入：

- [project.config.json](D:\Develop\bazi-shop\project.config.json)
- `project.private.config.json`

## 常用命令

```powershell
npm run dev:api
npm run check
npm run open
```
