# 疯狂深渊

《疯狂深渊》是一个面向抖音小游戏的竖屏克苏鲁像素肉鸽原型，核心体验是 3 分钟一局、8 个房间推进、4 名调查员切换，以及把“疯狂值”做成风险与收益并存的核心系统。

当前工作目录：

`D:\Develop\bazi-shop`

## 当前状态

- 小游戏主入口已切到 Canvas 架构：
  - [game.js](D:\Develop\bazi-shop\game.js)
  - [game/main.js](D:\Develop\bazi-shop\game\main.js)
  - [game/src/app.js](D:\Develop\bazi-shop\game\src\app.js)
  - [game/src/constants.js](D:\Develop\bazi-shop\game\src\constants.js)
- 抖音工程 `AppID` 已设置为 `ttf41382ae6a74c90b02`
- 当前文档、配置和运行入口都已统一为《疯狂深渊》
- 音频生成改为本地脚本方案，使用 MiniMax 密钥从本地忽略文件读取，不写进前端源码

## 核心玩法

- 4 名可切换调查员：艾达、马库斯、卡拉、李
- 8 房间短局循环：普通战斗、精英、祭坛事件、安全屋、Boss 房
- 疯狂值系统：
  - 31-60：轻度强化
  - 61-80：深度强化
  - 81-99：临界高风险高收益
  - 100：失控，强制受罚
- Build 方向：
  - 武器升级
  - 消耗品
  - 永久强化
  - 祭坛事件分支

## 本地启动

### 1. 打开项目

```powershell
cd D:\Develop\bazi-shop
npm install
```

### 2. 启动本地辅助服务

```powershell
npm run dev:api
```

可用接口：

- `GET http://127.0.0.1:8787/health`
- `GET http://127.0.0.1:8787/api/game-config`
- `GET http://127.0.0.1:8787/api/audio-manifest`

### 3. 导入抖音开发者工具

导入目录：

`D:\Develop\bazi-shop`

导入类型请选择“小游戏”。

## 音频资源

音频清单位于：

- [assets/audio/manifest.json](D:\Develop\bazi-shop\assets\audio\manifest.json)

MiniMax 音频生成脚本：

- [scripts/generate-minimax-audio.js](D:\Develop\bazi-shop\scripts\generate-minimax-audio.js)

生成命令：

```powershell
npm run audio:generate
```

说明：

- 生成脚本会从本地 `.env.local` 读取 `MINIMAX_API_KEY`
- 目前优先自动生成氛围 BGM 和场景音乐
- 高频打击类 SFX 仍保留为占位项，建议后续换成更短更干净的人工音效

详见：

- [docs/DOUYIN_SETUP.md](D:\Develop\bazi-shop\docs\DOUYIN_SETUP.md)
- [docs/CRAZY_ABYSS_AUDIO_PIPELINE.md](D:\Develop\bazi-shop\docs\CRAZY_ABYSS_AUDIO_PIPELINE.md)

## 设计来源

这次重构以你提供的本地设计资料为主：

- `C:\Users\gk_24\.mavis\sessions\mvs_9d3344d4dbb2495ab50fe17423e910d0\workspace\疯狂深渊-克苏鲁肉鸽`

目前已吸收进游戏骨架的内容包括：

- 房间节奏
- 角色定位
- 疯狂值分段
- Shrine / Rest / Boss 结构
- 克苏鲁式暗色像素氛围
