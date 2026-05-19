# Codex 瀹夊叏涓庤川閲忕粓瀹℃姤鍛?(PR #1)

**瀹℃煡鏃堕棿**锛?026-05-19  
**瀹℃煡鑼冨洿**锛歅R #1 (`feature/miniprogram-ai-bazi` 鈫?`master`) 鍏ㄩ儴鍙樻洿鏂囦欢  
**椤圭洰璺緞**锛歚D:\bazi-miniprogram-env\02_workspace\bazi-miniprogram`

---

## 涓€銆佸鏌ユ墽琛屾憳瑕?
| 瀹℃煡缁村害 | 缁撴灉 | 鍙戠幇鏁?|
|---------|------|--------|
| 瀹夊叏锛圓PI Keys / Secrets锛?| 鉁?PASS | 0 |
| 浜戝嚱鏁板畨鍏?| 鉁?PASS | 0 |
| 鍓嶇-浜戝嚱鏁伴泦鎴?| 鉁?PASS | 0 |
| 閿欒澶勭悊 | 鉁?PASS | 0 |
| 鍚堣锛堢姝㈣瘝锛?| 鉁?PASS | 0 |
| Git 鍗敓 | 鉁?PASS | 0 |
| 默认示例文本 娈嬬暀 | 鉁?PASS | 0 |
| package.json 绮剧畝 | 鉁?PASS | 0 |

**缁煎悎璇勭骇**锛氣渽 **APPROVED 鈥?鍙悎骞?*

---

## 浜屻€佸畨鍏ㄥ鏌?
### 2.1 API Keys / Secrets 妫€鏌?
**妫€鏌ユ柟娉?*锛歚grep -E 'API Key正则|LLM_API_KEY（云函数环境变量）|腾讯云敏感变量名'` 鍏ㄤ粨搴撴壂鎻?
**缁撴灉**锛氣渽 鏃犳硠闇?
| 鏂囦欢 | 鍖归厤鍐呭 | 鎬ц川 |
|------|---------|------|
| `cloudfunctions/analyzeBazi/index.js` | `process.env.LLM_API_KEY` | 鉁?鐜鍙橀噺璇诲彇锛岄潪纭紪鐮?|
| `README.md` | `LLM_API_KEY = 浣犵殑 MiniMax Token` | 鉁?鏂囨。鍗犱綅绗︼紝闈炵湡瀹?Key |
| `docs/03_manual_acceptance.md` | `LLM_API_KEY = 在云函数环境变量中填写，不写入仓库` | 鉁?娴嬭瘯鏂囨。鍗犱綅绗?|
| `scripts/check-project.js` | `腾讯云敏感变量名` | 鉁?瀹夊叏妫€鏌ラ€昏緫锛岄潪娉勯湶 |

**楠岃瘉缁撹**锛氭墍鏈?API Key 閫氳繃 `process.env` 鐜鍙橀噺璇诲彇锛屼笉瀛樺湪浜庝唬鐮佸簱涓€?
### 2.2 浜戝嚱鏁板畨鍏?
**妫€鏌ラ」**锛?
| 妫€鏌ラ」 | 缁撴灉 | 璇存槑 |
|--------|------|------|
| 浜戝嚱鏁颁笉鎵撳嵃 `process.env` | 鉁?PASS | `check-project.js` 楠岃瘉閫氳繃 |
| 浜戝嚱鏁颁笉鎵撳嵃 `config.apiKey` | 鉁?PASS | 鏃?`console.log(config.apiKey)` |
| 浜戝嚱鏁颁笉鎵撳嵃 `context` 瀵硅薄 | 鉁?PASS | 鏃?`context logging check` |
| 浜戝嚱鏁颁笉鏆撮湶瀹屾暣閿欒鍫嗘爤 | 鉁?PASS | 閿欒缁熶竴杩斿洖 `report.title` 鎻忚堪鎬ф秷鎭?|
| 浣跨敤 `http/https` 鑰岄潪 `fetch` | 鉁?PASS | 鍏煎寰俊浜戝嚱鏁拌繍琛屾椂鐜 |
| 鐜鍙橀噺鏍￠獙 | 鉁?PASS | `readConfig()` 鏍￠獙 LLM_PROVIDER/BASE_URL/MODEL/API_KEY |

**浜戝嚱鏁板叧閿畨鍏ㄨ璁?*锛?```javascript
// 鉁?鐜鍙橀噺閫氳繃 process.env 璇诲彇锛屼笉纭紪鐮?const apiKey = String(process.env.LLM_API_KEY || '').trim();

// 鉁?Authorization 澶翠粎鍦ㄨ姹傛椂鏋勯€狅紝涓嶆墦鍗?headers: { Authorization: `Bearer ${config.apiKey}` }

// 鉁?閿欒淇℃伅涓虹敤鎴峰弸濂芥弿杩帮紝涓嶆毚闇插唴閮ㄥ疄鐜?summary: '妯″瀷鏈嶅姟杩炴帴澶辫触锛岃绋嶅悗鍐嶈瘯銆?
```

---

## 涓夈€佷簯鍑芥暟浠ｇ爜瀹℃煡 (`cloudfunctions/analyzeBazi/index.js`)

### 3.1 鏁翠綋缁撴瀯 鉁?
```
254 琛岋紝缁撴瀯娓呮櫚锛?鈹溾攢鈹€ exports.main          # 鍏ュ彛鍑芥暟
鈹溾攢鈹€ postJson()            # HTTP POST 宸ュ叿
鈹溾攢鈹€ readConfig()          # 鐜鍙橀噺璇诲彇涓庢牎楠?鈹溾攢鈹€ normalizeInput()      # 杈撳叆鏍囧噯鍖?鈹溾攢鈹€ stringValue()         # 瀛楃涓插畨鍏ㄨ浆鎹?鈹溾攢鈹€ buildSystemPrompt()   # System Prompt 鏋勫缓
鈹溾攢鈹€ buildUserPrompt()     # User Prompt 鏋勫缓
鈹溾攢鈹€ buildReport()         # 鎶ュ憡鐢熸垚
鈹溾攢鈹€ parseJsonObject()     # JSON 瑙ｆ瀽锛堝惈闄嶇骇锛?鈹斺攢鈹€ sanitizeText()        # BANNED_PATTERNS 杩囨护
```

### 3.2 閿欒澶勭悊 鉁?
| 鍦烘櫙 | 澶勭悊鏂瑰紡 |
|------|---------|
| 閰嶇疆缂哄け | 杩斿洖 `ok: false` + `report.title: '閰嶇疆缂哄け'` |
| 杈撳叆涓嶅畬鏁?| 杩斿洖 `ok: false` + `report.title: '淇℃伅涓嶅畬鏁?` |
| HTTP 闈?2xx | 杩斿洖 `ok: false` + `report.title: '鍒嗘瀽鏆備笉鍙敤'` |
| HTTP 瓒呮椂/缃戠粶閿欒 | 鎹曡幏寮傚父锛岃繑鍥?`ok: false` + `report.title: '鍒嗘瀽鏆備笉鍙敤'` |
| JSON 瑙ｆ瀽澶辫触 | 闄嶇骇灏濊瘯姝ｅ垯鎻愬彇 `\{[\s\S]*\}`锛屼粛澶辫触鍒?report 涓哄厹搴曟枃妗?|

### 3.3 杈撳叆鏍￠獙 鉁?
```javascript
// 鉁?鎵€鏈夎緭鍏ュ瓧娈垫爣鍑嗗寲涓哄瓧绗︿覆锛岄槻姝㈡敞鍏?function normalizeInput(event) {
  return {
    birthday: stringValue(event.birthday),
    hour: stringValue(event.hour),
    gender: stringValue(event.gender),
    location: stringValue(event.location)
  };
}

// 鉁?蹇呭～瀛楁鏍￠獙
if (!input.birthday || !input.hour || !input.gender) {
  return { ok: false, ... };
}
```

### 3.4 杈撳嚭杩囨护 鉁?
```javascript
// 鉁?BANNED_PATTERNS 鍙岄噸淇濋殰
const BANNED_PATTERNS = [
  /鍙戣储/, /鏆村瘜/, /鏀硅繍/, /杞繍/, /鍖栬В/,
  /鐤剧梾/, /姝讳骸/, /鐏剧ジ/, /鐏鹃毦/,
  /濠氭亱.*(涓€瀹殀蹇呭畾|纭畾|娉ㄥ畾)/,
  /(涓€瀹殀蹇呭畾|纭畾|娉ㄥ畾).*(缁撳|绂诲|鍒嗘墜|澶嶅悎|濠氭亱)/,
  /淇濊瘉/, /蹇呯劧/
];

// 鉁?sanitizeText() 瀵?LLM 杈撳嚭杩涜鍚庤繃婊?function sanitizeText(text) {
  let result = String(text || '').trim();
  for (const pattern of BANNED_PATTERNS) {
    result = result.replace(pattern, '鐩稿叧鐜板疄鍒ゆ柇');
  }
  return result;
}
```

---

## 鍥涖€佸墠绔?浜戝嚱鏁伴泦鎴愬鏌?
### 4.1 浜戝嚱鏁拌皟鐢?(`pages/form/index.js`) 鉁?
```javascript
// 鉁?姝ｇ‘妫€鏌?res.result.ok锛堥潪鏃х増鐨?res.result.success锛?if (res.result && res.result.ok) {
  wx.navigateTo({
    url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify(res.result))}`
  });
}

// 鉁?閿欒鎯呭喌灞曠ず report.title
const msg = res.result && res.result.report ? res.result.report.title : '鍒嗘瀽澶辫触';
wx.showToast({ title: msg, icon: 'none', duration: 3000 });
```

### 4.2 缁撴灉灞曠ず (`pages/result/index.js`) 鉁?
```javascript
// 鉁?姝ｇ‘瑙ｆ瀽 URI 缂栫爜鐨?JSON
const parsed = JSON.parse(decodeURIComponent(options.data));
this.setData({
  report: parsed.report || null,  // 鉁?浣跨敤 report 缁撴瀯
  input: parsed.input || null
});
```

### 4.3 浜戝嚱鏁拌繑鍥炵粨鏋?鉁?
```json
{
  "ok": true,
  "input": { "birthday": "...", "hour": "...", "gender": "...", "location": "..." },
  "provider": "minimax",
  "model": "MiniMax-M2.7",
  "report": {
    "title": "...",
    "summary": "...",
    "disclaimer": "..."
  }
}
```

**鍓嶇涓庝簯鍑芥暟缁撴瀯瀹屽叏鍖归厤** 鉁?
---

## 浜斻€佸悎瑙勫鏌?
### 5.1 绂佹璇嶈繃婊?鉁?
| 绂佹璇嶇被鍒?| 鐘舵€?| 闃叉姢浣嶇疆 |
|-----------|------|---------|
| 璐㈠瘜绫伙紙鍙戣储銆佹毚瀵岋級 | 鉁?宸茶繃婊?| BANNED_PATTERNS + System Prompt |
| 鍛借繍鏀瑰彉绫伙紙鏀硅繍銆佽浆杩愩€佸寲瑙ｏ級 | 鉁?宸茶繃婊?| BANNED_PATTERNS + System Prompt |
| 鍋ュ悍姝讳骸绫伙紙鐤剧梾銆佹浜°€佺伨绁革級 | 鉁?宸茶繃婊?| BANNED_PATTERNS + System Prompt |
| 纭畾鎬ц〃杈撅紙淇濊瘉銆佸繀鐒躲€佷竴瀹氥€佸繀瀹氾級 | 鉁?宸茶繃婊?| BANNED_PATTERNS + System Prompt |
| 濠氭亱纭畾棰勬祴 | 鉁?宸茶繃婊?| BANNED_PATTERNS + System Prompt |

### 5.2 鍏嶈矗澹版槑 鉁?
| 浣嶇疆 | 鍐呭 |
|------|------|
| 浜戝嚱鏁?`DEFAULT_DISCLAIMER` | "鏈唴瀹逛粎鐢ㄤ簬浼犵粺骞叉敮鏂囧寲瀛︿範鍜屽ū涔愬弬鑰冿紝涓嶆瀯鎴愮幇瀹炲喅绛栦緷鎹€傝鐞嗘€х湅寰咃紝閲嶈浜嬮」璇蜂互鐜板疄淇℃伅鍜屼笓涓氭剰瑙佷负鍑嗐€? |
| 鎶ュ憡鍥哄畾瀛楁 | `report.disclaimer` |
| about 椤甸潰 | 瀹屾暣鍚堣澹版槑 |

### 5.3 System Prompt 鍚堣璁捐 鉁?
```javascript
function buildSystemPrompt() {
  return [
    '浣犳槸浼犵粺骞叉敮鏂囧寲瀛︿範鍔╂墜銆?,
    '璇峰彧浠庝紶缁熷共鏀€佷簲琛屻€佽妭姘斾笌姘戜織鏂囧寲瑙掑害鍋氬涔犲拰濞变箰鍙傝€冦€?,
    '涓嶈缁欏嚭鍙戣储銆佹敼杩愩€佺柧鐥呫€佹浜°€佺伨绁搞€佸鎭嬬‘瀹氭€ч娴嬨€?,  // 鉁?    '涓嶈浣跨敤涓€瀹氥€佸繀瀹氥€佹敞瀹氥€佷繚璇佺瓑纭畾鎬ц〃杈俱€?,            // 鉁?    '璇风敤绠€浣撲腑鏂囪緭鍑轰竴涓?JSON 瀵硅薄锛屽彧鍖呭惈 title銆乻ummary銆乨isclaimer 涓変釜瀛楃涓插瓧娈点€?,
    `disclaimer 鍥哄畾浣跨敤锛?{DEFAULT_DISCLAIMER}`
  ].join('\n');
}
```

---

## 鍏€丟it 鍗敓妫€鏌?鉁?
### 6.1 `.gitignore` 楠岃瘉

| 蹇界暐椤?| 鐘舵€?|
|-------|------|
| `.env`, `.env.local` | 鉁?宸插拷鐣?|
| `project.private.config.json` | 鉁?宸插拷鐣?|
| `cloudfunctions/**/.env` | 鉁?宸插拷鐣?|
| `*.key`, `*.pem` | 鉁?宸插拷鐣?|
| `04_secrets_local/` | 鉁?宸插拷鐣?|
| `node_modules/` | 鉁?宸插拷鐣?|

### 6.2 鏁忔劅淇℃伅妫€鏌?
- 鉁?鏃犵湡瀹?API Key 鎻愪氦
- 鉁?鏃?`project.private.config.json` 鎻愪氦锛堝彧鏈?`.example`锛?- 鉁?鏃?`.env` 鏂囦欢鎻愪氦

### 6.3 Git 閰嶇疆

- 鉁?`project.config.json` 浣跨敤 `touristappid`锛堥潪鐪熷疄 ID锛?- 鈿狅笍 `GIT_CONFIG_NEEDED.md` 瀛樺湪锛堟彁绀洪渶璁剧疆 Git 鐢ㄦ埛淇℃伅锛?
---

## 涓冦€丠ello World 娈嬬暀妫€鏌?鉁?
**鎵弿鑼冨洿**锛氭墍鏈?`.js`, `.json`, `.md`, `.wxml` 鏂囦欢

**鎵弿妯″紡**锛歚hello|Helloworld|HelloWorld|helloworld|test123|placeholder`

**缁撴灉**锛氣渽 鏃犳畫鐣?
鍞竴鍖归厤椤癸細
- `project.config.json` 涓殑 `"libVersion": "latest"` 鈥?姝ｅ父閰嶇疆
- 琛ㄥ崟 `placeholder` 灞炴€?鈥?UI 鍗犱綅绗︼紝姝ｅ父鐢ㄩ€?- `scripts/check-project.js` 鈥?妫€鏌ヨ剼鏈嚜韬紝闈炰笟鍔′唬鐮?
---

## 鍏€乸ackage.json 绮剧畝妫€鏌?鉁?
**浜戝嚱鏁?`package.json`**锛?
```json
{
  "name": "analyzeBazi",
  "version": "1.0.0",
  "description": "Bazi analysis cloud function",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"   // 鉁?浠呭井淇′簯鍑芥暟 SDK
  }
}
```

**璇勪及**锛氣渽 鏈€灏忎緷璧栵紝浠?`wx-server-sdk`锛岀鍚堝井淇′簯鍑芥暟瑙勮寖銆?
---

## 涔濄€佽嚜鍔ㄥ寲妫€鏌ラ獙璇?
**杩愯 `node scripts/check-project.js`**锛?
```
=== check-project.js results ===

[PASS] app.json 瀛樺湪
[PASS] app.json pages 鏁扮粍闈炵┖
[PASS] 椤甸潰瀛樺湪: pages/index/index
[PASS] 椤甸潰閰嶇疆: pages/index/index
[PASS] 椤甸潰妯℃澘: pages/index/index
[PASS] 椤甸潰鏍峰紡: pages/index/index
[PASS] 椤甸潰瀛樺湪: pages/form/index
[PASS] 椤甸潰閰嶇疆: pages/form/index
[PASS] 椤甸潰妯℃澘: pages/form/index
[PASS] 椤甸潰鏍峰紡: pages/form/index
[PASS] 椤甸潰瀛樺湪: pages/result/index
[PASS] 椤甸潰閰嶇疆: pages/result/index
[PASS] 椤甸潰妯℃澘: pages/result/index
[PASS] 椤甸潰鏍峰紡: pages/result/index
[PASS] 椤甸潰瀛樺湪: pages/about/index
[PASS] 椤甸潰閰嶇疆: pages/about/index
[PASS] 椤甸潰妯℃澘: pages/about/index
[PASS] 椤甸潰鏍峰紡: pages/about/index
[PASS] cloudfunctions/analyzeBazi/index.js 瀛樺湪
[PASS] cloudfunctions/analyzeBazi/package.json 瀛樺湪
[PASS] .gitignore 鍖呭惈 .env
[PASS] .gitignore 鍖呭惈 project.private.config
[PASS] 浜戝嚱鏁颁笉鎵撳嵃 process.env
[PASS] 浜戝嚱鏁颁笉鎵撳嵃 API Key
[PASS] 浜戝嚱鏁颁笉鎵撳嵃 context 瀵硅薄
[PASS] app.js 鍖呭惈 wx.cloud.init
[PASS] components/disclaimer 瀛樺湪
[PASS] components/report-card 瀛樺湪
[PASS] project.config.json appid 涓嶆槸鐪熷疄ID

29 passed, 0 failed
```

**缁撹**锛氣渽 鍏ㄩ儴閫氳繃

---

## 鍗併€侀潪闃诲鎬у缓璁紙鍙€変紭鍖栵級

| # | 绫诲埆 | 寤鸿 | 浼樺厛绾?|
|---|------|------|--------|
| 1 | 鐩戞帶 | 浜戝嚱鏁板彲娣诲姞璇锋眰璁℃暟/閿欒鐜囩洃鎺э紙寰俊浜戝嚱鏁拌嚜甯﹀熀纭€鐩戞帶锛?| 鍙€?|
| 2 | 閲嶈瘯 | HTTP 璇锋眰澶辫触鏃跺彲鑰冭檻鎸囨暟閫€閬块噸璇曚竴娆?| 鍙€?|
| 3 | 鏃ュ織 | 浜戝嚱鏁板彲浣跨敤寰俊浜戝嚱鏁版棩蹇楋紙`wx.cloud.logger()`锛夋浛浠?console.log | 鍙€?|

**浠ヤ笂鍧囦负鍙€変紭鍖栵紝褰撳墠瀹炵幇宸茶揪鍒扮敓浜у氨缁爣鍑嗐€?*

---

## 鍗佷竴銆佺粓瀹＄粨璁?
### 鉁?APPROVED 鈥?鍙悎骞?
| 缁村害 | 璇勭骇 | 璇存槑 |
|------|------|------|
| 瀹夊叏 | 鉁?PASS | 鏃?API Key 娉勯湶锛岀幆澧冨彉閲忛殧绂绘纭?|
| 浜戝嚱鏁板畨鍏?| 鉁?PASS | 鏃犳晱鎰熶俊鎭墦鍗帮紝杈撳叆杈撳嚭鍧囨湁杩囨护 |
| 鍓嶇-浜戝嚱鏁伴泦鎴?| 鉁?PASS | 缁撴瀯瀹屽叏鍖归厤锛岄敊璇鐞嗗畬鏁?|
| 閿欒澶勭悊 | 鉁?PASS | 澶氬眰闃插尽锛屽厹搴曟枃妗堝畬鍠?|
| 鍚堣 | 鉁?PASS | BANNED_PATTERNS + System Prompt + 鍏嶈矗澹版槑涓夐噸闃叉姢 |
| Git 鍗敓 | 鉁?PASS | .gitignore 姝ｇ‘锛屾棤绉樺瘑鎻愪氦 |
| 默认示例文本 | 鉁?PASS | 鏃犳畫鐣?|
| package.json | 鉁?PASS | 鏈€灏忎緷璧栵紝绗﹀悎瑙勮寖 |

**PR #1 鍙樻洿鍐呭**锛氬叓瀛楀垎鏋愪簯鍑芥暟 + 灏忕▼搴忓墠绔〉闈㈡惌寤猴紝鎵€鏈夊鏌ラ」鍧囬€氳繃銆?
---

*瀹℃煡宸ュ叿锛歡rep, node scripts/check-project.js, 浜哄伐浠ｇ爜瀹℃煡*  
*瀹℃煡浜猴細Hermes Codex Agent*  
*瀹℃煡鏃堕棿锛?026-05-19*



