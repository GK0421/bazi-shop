# 疯狂深渊音频生成方案

## 目标

这套方案用于给《疯狂深渊》快速补齐第一版氛围音频，重点是：

- 主菜单 BGM
- 常规战斗 BGM
- Boss 战 BGM
- 安全屋 BGM
- 少量场景过门音

不建议直接用生成式音乐替代所有短打击 SFX。像 `开枪`、`命中`、`按钮点击` 这类高频短反馈，后续最好换成更短更干净的人工音效。

## 文件位置

- 音频清单：[assets/audio/manifest.json](D:\Develop\bazi-shop\assets\audio\manifest.json)
- 生成脚本：[scripts/generate-minimax-audio.js](D:\Develop\bazi-shop\scripts\generate-minimax-audio.js)
- 输出目录：`D:\Develop\bazi-shop\assets\audio\generated`

## 配置方式

本地密钥放在根目录忽略文件：

`D:\Develop\bazi-shop\.env.local`

使用变量：

```env
MINIMAX_API_KEY=你的本地密钥
MINIMAX_MUSIC_MODEL=music-2.6
```

## 生成命令

```powershell
cd D:\Develop\bazi-shop
npm run audio:generate
```

也可以只生成某几条：

```powershell
node .\scripts\generate-minimax-audio.js bgm_menu bgm_boss
```

## 生成策略

根据 MiniMax 官方音乐接口，当前脚本使用：

- `POST /v1/music_generation`
- `model = music-2.6`
- `is_instrumental = true`
- `output_format = hex`

官方参考：

- [MiniMax Music Generation API](https://platform.minimax.io/docs/api-reference/music-generation)
- [MiniMax Music Generation Guide](https://platform.minimax.io/docs/guides/music-generation)

## 当前清单解释

### 已接入自动生成

- `bgm_menu`
- `bgm_battle`
- `bgm_boss`
- `bgm_safe`
- `sting_room_intro`
- `sting_victory`

### 先保留占位

- `ui_button`
- `ui_alert`
- `weapon_pistol`
- `weapon_shotgun`
- `skill_mental_shock`
- `boss_scream`

这些占位项保留在清单里，是为了后面你替换成本地手工 SFX 时，命名和路径不用再改。

## 后续建议

### 第一批就该补的

- `ui_button`
- `weapon_pistol`
- `weapon_shotgun`
- `boss_scream`

### 第二批再补

- 角色技能差异化音效
- 房间环境氛围底噪
- 失控状态的失真层

## 注意

- MiniMax 返回 `url` 时链接会过期，脚本现在直接请求 `hex` 并落盘
- 生成音频默认输出为 `mp3`
- 生成结果不自动进 Git，避免把大体积实验素材混进代码仓库
