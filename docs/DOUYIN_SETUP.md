# 今日人设签 Vibe Card

## 项目位置

`D:\Develop\bazi-shop`

## 当前状态

项目已从抖音小程序改为抖音小游戏结构，并统一改名为 `今日人设签 Vibe Card`。

当前关键入口文件：

- [game.js](D:\Develop\bazi-shop\game.js)
- [game.json](D:\Develop\bazi-shop\game.json)
- [project.config.json](D:\Develop\bazi-shop\project.config.json)

## 前端结构

- [game/main.js](D:\Develop\bazi-shop\game\main.js): 小游戏启动入口
- [game/src/app.js](D:\Develop\bazi-shop\game\src\app.js): 渲染、交互、场景切换
- [game/src/constants.js](D:\Develop\bazi-shop\game\src\constants.js): 品牌名、颜色、选项和配置常量

## 后端结构

- [backend/server.js](D:\Develop\bazi-shop\backend\server.js): 本地接口服务

## 启动步骤

### 1. 启动本地 API

```powershell
cd D:\Develop\bazi-shop
npm install
npm run dev:api
```

### 2. 打开抖音开发者工具

导入根目录：

`D:\Develop\bazi-shop`

导入时请选择“小游戏”。

## AppID

当前已配置：

`ttf41382ae6a74c90b02`

已写入：

- `project.config.json`
- `project.private.config.json`

## 环境变量

推荐在 `backend/.env` 中填写：

```env
PORT=8787
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_MODEL=MiniMax-M2.7
LLM_API_KEY=你的模型密钥
```

也支持直接使用系统环境变量 `MINIMAX_API_KEY`。

## GitHub

远端仓库：

`origin = https://github.com/GK0421/bazi-shop.git`

本机 Git 用户：

- `user.name = GUOK`
- `user.email = Gk_24@163.com`
