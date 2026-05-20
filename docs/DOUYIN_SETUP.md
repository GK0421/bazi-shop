# 疯狂深渊抖音小游戏接入说明

## 项目位置

`D:\Develop\bazi-shop`

## 入口结构

- [game.js](D:\Develop\bazi-shop\game.js)
- [game.json](D:\Develop\bazi-shop\game.json)
- [project.config.json](D:\Develop\bazi-shop\project.config.json)
- [game/main.js](D:\Develop\bazi-shop\game\main.js)
- [game/src/app.js](D:\Develop\bazi-shop\game\src\app.js)
- [game/src/constants.js](D:\Develop\bazi-shop\game\src\constants.js)

## AppID

当前抖音小游戏 `AppID`：

`ttf41382ae6a74c90b02`

已写入：

- [project.config.json](D:\Develop\bazi-shop\project.config.json)
- [project.private.config.json](D:\Develop\bazi-shop\project.private.config.json)

## 运行步骤

### 1. 安装依赖

```powershell
cd D:\Develop\bazi-shop
npm install
```

### 2. 启动本地辅助服务

```powershell
npm run dev:api
```

这个服务不是游戏运行必需项，但会提供：

- 健康检查
- 音频清单读取
- 本地资源调试接口

### 3. 导入抖音开发者工具

导入路径：

`D:\Develop\bazi-shop`

项目类型：

`小游戏`

## 当前已落地的玩法骨架

- 4 名调查员切换
- 8 个房间推进
- 普通房 / 精英房 / 祭坛房 / 安全屋 / Boss 房
- 疯狂值系统
- 武器、消耗品、永久强化、祭坛分支
- 竖屏 Canvas 渲染和触控操作

## 当前未完成的资源层

- 正式像素立绘
- 正式敌人帧动画
- 真正可发布的短 SFX
- 录屏宣传素材

## 音频相关

音频清单：

- [assets/audio/manifest.json](D:\Develop\bazi-shop\assets\audio\manifest.json)

音频脚本：

- [scripts/generate-minimax-audio.js](D:\Develop\bazi-shop\scripts\generate-minimax-audio.js)

音频文档：

- [docs/CRAZY_ABYSS_AUDIO_PIPELINE.md](D:\Develop\bazi-shop\docs\CRAZY_ABYSS_AUDIO_PIPELINE.md)
