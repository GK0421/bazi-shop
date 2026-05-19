# 娴嬭瘯璁″垝 (Agent 5)

**鍒涘缓鏃堕棿**锛?026-05-18

---

## 涓€銆佽嚜鍔ㄥ寲妫€鏌?
### scripts/check-project.js

杩愯鏂瑰紡锛?```bash
cd D:\bazi-miniprogram-env\02_workspace\bazi-miniprogram
node scripts/check-project.js
```

妫€鏌ラ」锛?
| # | 妫€鏌ラ」 | 鏈熸湜 |
|---|--------|------|
| 1 | app.json 瀛樺湪 | true |
| 2 | app.json pages 鏁扮粍闈炵┖ | true |
| 3 | 姣忎釜椤甸潰 4 涓枃浠堕兘瀛樺湪锛坖s/json/wxml/wxss锛?| 鍏ㄩ儴 true |
| 4 | cloudfunctions/analyzeBazi/index.js 瀛樺湪 | true |
| 5 | cloudfunctions/analyzeBazi/package.json 瀛樺湪 | true |
| 6 | 鎵€鏈?.js 鏂囦欢涓嶅惈 API Key占位 瀛楃涓?| 0 澶?|
| 7 | 鎵€鏈?.js 鏂囦欢涓嶅惈 LLM_API_KEY=云函数环境变量 | 0 澶?|
| 8 | 鎵€鏈?.js 鏂囦欢涓嶅惈 腾讯云敏感变量名 | 0 澶?|
| 9 | .gitignore 鍖呭惈 .env | true |
| 10 | .gitignore 鍖呭惈 project.private.config | true |
| 11 | 浜戝嚱鏁?index.js 涓嶆墦鍗?process.env | true |
| 12 | 浜戝嚱鏁?index.js 涓嶆墦鍗?API Key | true |
| 13 | 浜戝嚱鏁?index.js 涓嶆墦鍗?context | true |
| 14 | app.js 鍖呭惈 wx.cloud.init | true |
| 15 | components/disclaimer 瀛樺湪 | true |
| 16 | components/report-card 瀛樺湪 | true |

閫€鍑虹爜锛? = 鍏ㄩ儴閫氳繃锛? = 瀛樺湪澶辫触椤?
---

## 浜屻€佹墜鍔ㄩ獙鏀舵竻鍗?
璇﹁ `docs/03_manual_acceptance.md`

---

## 涓夈€佷簯鍑芥暟鍗曞厓娴嬭瘯锛堟ā鎷燂級

### 3.1 缂哄皯鐜鍙橀噺

**杈撳叆**锛氭棤鐜鍙橀噺
**鏈熸湜杩斿洖**锛?```json
{
  "ok": false,
  "report": { "title": "閰嶇疆缂哄け", "summary": "璇峰厛閰嶇疆..." }
}
```

### 3.2 缂哄皯蹇呭～瀛楁

**杈撳叆**锛歚{ birthday: '', hour: '', gender: '' }`
**鏈熸湜杩斿洖**锛?```json
{
  "ok": false,
  "report": { "title": "淇℃伅涓嶅畬鏁?, "summary": "璇峰～鍐欑敓鏃ャ€佸嚭鐢熸椂杈板拰鎬у埆銆? }
}
```

### 3.3 姝ｅ父杈撳叆

**杈撳叆**锛歚{ birthday: '1990-01-01', hour: 23, gender: '鐢?, location: '鍖椾含' }`
**鏈熸湜杩斿洖**锛?```json
{
  "ok": true,
  "provider": "minimax",
  "model": "MiniMax-M2.7",
  "report": {
    "title": "...",
    "summary": "...",
    "disclaimer": "鏈唴瀹逛粎鐢ㄤ簬..."
  }
}
```

### 3.4 BANNED_WORDS 杩囨护

**杈撳叆**锛氬ぇ妯″瀷杈撳嚭鍖呭惈"鍙戣储"
**鏈熸湜**锛氳緭鍑轰腑"鍙戣储"琚浛鎹负"鐩稿叧鐜板疄鍒ゆ柇"

---

## 鍥涖€佸井淇″紑鍙戣€呭伐鍏锋墜鍔ㄦ祴璇?
璇﹁ `docs/03_manual_acceptance.md`
