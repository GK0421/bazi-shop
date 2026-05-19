# 鏈€缁堜氦浠樻姤鍛?(Agent 8)

**鐢熸垚鏃堕棿**锛?026-05-19 07:56
**瀹℃煡缁撹**锛氣渽 APPROVED 鈥?鏃?BLOCKER锛屽彲鍚堝苟

---

## 涓€銆侀」鐩熀鏈俊鎭?
| 椤圭洰 | 鍐呭 |
|------|------|
| 椤圭洰鍚嶇О | 鍏瓧渚垮埄搴楋紙bazi-shop锛?|
| 椤圭洰璺緞 | `D:\bazi-miniprogram-env\02_workspace\bazi-miniprogram` |
| GitHub 浠撳簱 | https://github.com/GK0421/bazi-shop |
| 褰撳墠鍒嗘敮 | feature/miniprogram-ai-bazi |
| PR 閾炬帴 | https://github.com/GK0421/bazi-shop/pull/1 |
| 瀹℃煡鐘舵€?| 鉁?APPROVED |

---

## 浜屻€佸凡瀹屾垚鍐呭

### 椤甸潰锛堝叡 4 涓級

| 椤甸潰 | 璺緞 | 璇存槑 |
|------|------|------|
| 棣栭〉锛堣惤鍦伴〉锛?| pages/index/ | 椤圭洰浠嬬粛 + 鎸夐挳瀵艰埅 + 鍏嶈矗澹版槑 |
| 淇℃伅濉啓椤?| pages/form/ | 鐢熸棩/鏃惰景/鎬у埆/鍑虹敓鍦?+ 浜戝嚱鏁拌皟鐢?|
| 缁撴灉灞曠ず椤?| pages/result/ | report.title + summary + disclaimer + 杈撳叆淇℃伅 |
| 鍏充簬椤?| pages/about/ | 椤圭洰鏉ユ簮 / bazi-skill 鏉ユ簮 / License / 鍚堣澹版槑 |

### 缁勪欢锛堝叡 2 涓級

| 缁勪欢 | 璇存槑 |
|------|------|
| components/disclaimer/ | 鍏嶈矗澹版槑鏂囨湰缁勪欢 |
| components/report-card/ | 鎶ュ憡鍗＄墖瀹瑰櫒缁勪欢 |

### 浜戝嚱鏁?
| 椤圭洰 | 璇存槑 |
|------|------|
| cloudfunctions/analyzeBazi/ | 瀹屾暣鍏瓧鍒嗘瀽浜戝嚱鏁?|
| 閿欒鐮?| 閰嶇疆缂哄け / 淇℃伅涓嶅畬鏁?/ 鍒嗘瀽鏆備笉鍙敤 / 杩炴帴澶辫触 |
| BANNED_PATTERNS | 杩囨护鍙戣储/鏀硅繍/鐤剧梾/姝讳骸/鐏剧ジ绛夌鐢ㄨ瘝 |
| 鍚堣杩囨护 | sanitizeText() 鍙岄噸闃叉姢 |
| API Key 淇濇姢 | 浠呰鍙?process.env锛屼笉鎵撳嵃 |

### 鏂囨。

| 鏂囨。 | 璇存槑 |
|------|------|
| docs/00_project_audit.md | 椤圭洰浣撴鎶ュ憡 |
| docs/01_compliance_review.md | 鍚堣瀹℃煡鎶ュ憡 |
| docs/02_test_plan.md | 鑷姩鍖栨祴璇曡鍒?|
| docs/03_manual_acceptance.md | 鎵嬪姩楠屾敹娓呭崟 |
| docs/04_codex_final_review.md | Codex 鏈€缁堝畨鍏ㄥ鏌?|
| .hermes/plans/bazi_miniprogram_full_dev_plan.md | 瀹屾暣寮€鍙戣鍒?|

### 娴嬭瘯缁撴灉

| 娴嬭瘯 | 缁撴灉 |
|------|------|
| scripts/check-project.js | 29/29 PASS |
| 瀹夊叏鎵弿锛堟棤 APIKEY- / API Key锛?| 0 澶勬硠闇?|
| 鍚堣瀹℃煡 | PASS锛堟棤杩濊鏂囨锛?|
| Codex 鏈€缁堝鏌?| APPROVED锛? 缁村害鍏ㄩ儴 PASS锛?|

---

## 涓夈€佺幆澧冨彉閲忔竻鍗曪紙浠呭彉閲忓悕锛屾棤鍊硷級

閮ㄧ讲浜戝嚱鏁版椂鍦ㄥ井淇′簯寮€鍙戞帶鍒跺彴閰嶇疆浠ヤ笅鐜鍙橀噺锛?
| 鍙橀噺鍚?| 璇存槑 |
|--------|------|
| LLM_PROVIDER | 鎻愪緵鍟嗭紝鍥哄畾涓?`minimax` |
| LLM_BASE_URL | MiniMax API 鍦板潃 `https://api.minimaxi.com/v1` |
| LLM_MODEL | 妯″瀷鍚嶇О `MiniMax-M2.7` |
| LLM_API_KEY | MiniMax API Key锛堜綘鐨勭湡瀹?在云函数环境变量中填写，不写入仓库 Token锛?|

---

## 鍥涖€佷粛闇€鐢ㄦ埛鎵嬪姩瀹屾垚鐨勪簨椤?
### 4.1 MiniMax API Key

褰撳墠浜戝嚱鏁颁腑鐨?`LLM_API_KEY` 鐜鍙橀噺闇€瑕侀厤缃湡瀹炵殑 MiniMax Token銆?
**鎿嶄綔**锛氬井淇′簯寮€鍙戞帶鍒跺彴 鈫?浜戝嚱鏁?鈫?analyzeBazi 鈫?閰嶇疆 鈫?鐜鍙橀噺 鈫?娣诲姞 `LLM_API_KEY` = `在云函数环境变量中填写，不写入仓库`

### 4.2 寰俊灏忕▼搴忕湡瀹?AppID

褰撳墠 `project.config.json` 涓?AppID 涓?`touristappid`锛堟祴璇曠敤锛夈€?
**鎿嶄綔**锛氬湪寰俊鍏紬骞冲彴鐢宠灏忕▼搴?AppID锛屾浛鎹?`project.config.json` 涓殑 `touristappid`銆傚悓鏃跺皢 `project.private.config.json.example` 澶嶅埗涓?`project.private.config.json` 骞跺～鍏ョ湡瀹?AppID銆?
### 4.3 浜戝嚱鏁伴儴缃?
**鎿嶄綔**锛?1. 鎵撳紑寰俊寮€鍙戣€呭伐鍏?2. 瀵煎叆椤圭洰锛歚D:azi-miniprogram-env_workspaceazi-miniprogram`
3. 寮€閫氫簯寮€鍙戯紙鐜 ID锛歚cloud1-d1gwyutj2d122bc22`锛?4. 浜戝嚱鏁伴潰鏉?鈫?鍙抽敭 `cloudfunctions/analyzeBazi` 鈫?涓婁紶骞堕儴缃?5. 鍦ㄤ簯寮€鍙戞帶鍒跺彴锛坔ttps://console.cloud.miniprogram.com/锛夐厤缃笂杩?4 涓幆澧冨彉閲?6. 缂栬瘧娴嬭瘯

### 4.4 GitHub PR 鍚堝苟

**鎿嶄綔**锛氬鏌?PR 鍐呭鍚庯紝鍓嶅線 https://github.com/GK0421/bazi-shop/pull/1 鐐瑰嚮 "Merge" 鍚堝苟鍒?master 鍒嗘敮銆?
### 4.5 寰俊瀹℃牳鎻愪氦

鐢宠鐪熷疄 AppID 鍚庯紝鍦ㄥ井淇″紑鍙戣€呭伐鍏蜂腑涓婁紶浠ｇ爜锛屾彁浜ゅ鏍搞€傚皬绋嬪簭绫荤洰寤鸿閫夋嫨"宸ュ叿"銆?
---

## 浜斻€佸悎瑙勫０鏄?
鏈」鐩畾浣嶄负"浼犵粺骞叉敮鏂囧寲瀛︿範涓庡ū涔愬弬鑰冨伐鍏?锛屾墍鏈?AI 杈撳嚭鍧囩粡杩囷細
1. System prompt 鏄庣‘绂佹纭畾鎬ч娴?2. BANNED_PATTERNS 杩囨护绂佺敤璇?3. 寮哄埗鍏嶈矗澹版槑锛坮eport.disclaimer锛?
灏忕▼搴忓悕绉帮細鍏瓧渚垮埄搴?绠€浠嬶細浼犵粺骞叉敮鏂囧寲瀛︿範宸ュ叿

---

## 鍏€佷笉鍖呭惈鐨勫唴瀹癸紙瀹夊叏鎵胯锛?
- 鉂?鏃?API Key锛堝潎閫氳繃 process.env锛?- 鉂?鏃?.env.local 鏂囦欢
- 鉂?鏃?project.private.config.json
- 鉂?鏃犲井淇＄瀵嗛厤缃?- 鉂?鏃?Hello World 娈嬬暀
- 鉂?鏃?console.log(process.env / apiKey / context)
- 鉂?鏃犵姝㈣瘝姹囷紙绠楀懡澶у笀 / 鏀硅繍 / 鍙戣储 / 鐤剧梾 / 姝讳骸 / 鐏剧ジ / 濠氭亱蹇呯劧 / 鎶曡祫寤鸿 / 鍖荤枟寤鸿锛?
