const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const port = Number(process.env.PORT || 8787);
const baseUrl = process.env.LLM_BASE_URL || "https://api.minimax.chat/v1";
const model = process.env.LLM_MODEL || "MiniMax-M2.7";

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "persona-vibe-card-backend",
    model,
    hasApiKey: Boolean(resolveApiKey())
  });
});

app.post("/api/analyze-bazi", async (req, res) => {
  const { birthday, hour, gender, location } = req.body || {};

  const validationError = validatePayload({ birthday, hour, gender, location });
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "缺少 LLM_API_KEY 或 MINIMAX_API_KEY，请先配置后端环境变量。"
    });
  }

  const hourNum = Number(hour);
  const prompt = buildPrompt({ birthday, hourNum, gender, location });

  try {
    const data = await invokeChatCompletion({
      apiKey,
      baseUrl,
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      maxTokens: 900
    });

    const rawResult = data?.choices?.[0]?.message?.content;
    if (!rawResult) {
      return res.status(502).json({ success: false, error: "模型返回为空，请稍后重试。" });
    }

    let displayResult = sanitizeResult(rawResult);
    if (!looksDisplayReady(displayResult)) {
      const rewritten = await rewriteForDisplay({
        apiKey,
        baseUrl,
        model,
        draft: rawResult
      });
      if (rewritten) {
        displayResult = sanitizeResult(rewritten);
      }
    }

    return res.json({
      success: true,
      result: displayResult,
      modelUsed: model,
      requestId: data?.id || "local-dev"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `后端请求失败：${error.message}`
    });
  }
});

app.listen(port, () => {
  console.log(`persona-vibe-card backend listening on http://127.0.0.1:${port}`);
});

function resolveApiKey() {
  return process.env.LLM_API_KEY || process.env.MINIMAX_API_KEY || "";
}

function validatePayload({ birthday, hour, gender, location }) {
  if (!birthday || !gender) {
    return "缺少必要参数：birthday、gender";
  }

  const hourNum = Number(hour);
  if (!Number.isInteger(hourNum) || hourNum < 0 || hourNum > 23) {
    return "时辰参数无效，需要 0 到 23 之间的整数。";
  }

  if (!["男", "女"].includes(gender)) {
    return "性别参数无效，只支持 男 或 女。";
  }

  if (String(location || "").length > 100) {
    return "出生地长度不能超过 100 个字符。";
  }

  return "";
}

function buildPrompt({ birthday, hourNum, gender, location }) {
  return [
    "请根据以下信息，生成适合抖音小游戏展示的超短中文灵感卡：",
    `生日：${birthday}`,
    `时辰：${hourNum} 点（${getShichen(hourNum)}）`,
    `性别：${gender}`,
    `出生地：${location || "未填写"}`,
    "",
    "请把它理解为东方气质灵感卡，不要做算命式预测，不要做具体吉凶判断。",
    "",
    "输出要求：",
    "- 使用纯文本分段",
    "- 不要输出思考过程",
    "- 只输出最终答案",
    "- 总正文尽量控制在 90 个汉字内，不含免责声明",
    "- 每个小节 1 行，尽量控制在 12 到 24 个汉字内",
    "- 句子短，节奏快，适合短内容消费",
    "- 允许适度文艺，但不要玄乎，不要夸大，不要绝对化",
    "- 不要出现事业运、桃花运、财运暴涨、命中注定等说法",
    "- 必须严格使用以下标题：",
    "【气质】",
    "【高光】",
    "【提醒】",
    "【动作】",
    "【免责声明】"
  ].join("\n");
}

function sanitizeResult(text) {
  const bannedWords = ["包改运", "保证", "必定", "死亡日期", "投资建议", "医疗建议"];
  let safeText = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^\s+|\s+$/g, "");

  const sectionStart = safeText.search(/【四柱】|【五行】|【性格】|【建议】|【免责声明】/);
  const shortSectionStart = safeText.search(/【气质】|【高光】|【提醒】|【动作】|【免责声明】/);
  const finalStart = shortSectionStart >= 0 ? shortSectionStart : sectionStart;
  if (finalStart > 0) {
    safeText = safeText.slice(finalStart);
  }

  safeText = safeText
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return true;
      }

      return !/^(用户要求|让我|首先|我正在|我开始|I\s|I'|Using|Now\sI|This\s|After\s|Focusing|Examining|The\s|I'll)/i.test(trimmed);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  for (const word of bannedWords) {
    if (safeText.includes(word)) {
      safeText = `${safeText}\n\n[系统提示：输出中检测到高风险措辞，请人工复核。]`;
      break;
    }
  }

  safeText = clampSectionLength(safeText);
  safeText = safeText.replace(/【免责声明】\n.*$/s, "【免责声明】\n本卡仅供灵感和气质探讨，不作命运判定。");

  if (!safeText.includes("【免责声明】")) {
    safeText = `${safeText}\n\n【免责声明】\n本卡仅供灵感和气质探讨，不作命运判定。`;
  }

  return safeText || "模型未返回可展示内容，请稍后重试。";
}

function looksDisplayReady(text) {
  return (
    text.includes("【气质】") &&
    text.includes("【高光】") &&
    text.includes("【提醒】") &&
    text.includes("【动作】") &&
    text.includes("【免责声明】") &&
    !/^(用户需要|让我|首先|我正在|我开始|I\s|I'|Using|Now\sI|This\s|After\s|Focusing|Examining|The\s|I'll)/im.test(text)
  );
}

async function rewriteForDisplay({ apiKey, baseUrl, model, draft }) {
  try {
    const data = await invokeChatCompletion({
      apiKey,
      baseUrl,
      model,
      messages: [
        {
          role: "system",
          content: [
            "你是一个内容整理助手。",
            "请把输入草稿整理成可直接展示给用户的最终答案。",
            "只保留结论，不要保留推理过程、计算过程、英文自言自语或草稿痕迹。",
            "风格要像抖音里的轻量结果卡，短、清楚、可一眼看完。",
            "不要做命运预测，不要写吉凶和具体运势。",
            "总正文尽量控制在 90 个汉字内，不含免责声明。",
            "每个小节尽量控制在 12 到 24 个汉字内。",
            "必须严格使用以下标题：",
            "【气质】",
            "【高光】",
            "【提醒】",
            "【动作】",
            "【免责声明】"
          ].join("\n")
        },
        {
          role: "user",
          content: `请把以下草稿整理为最终展示文本：\n\n${draft}`
        }
      ],
      maxTokens: 900
    });

    return data?.choices?.[0]?.message?.content || "";
  } catch (_error) {
    return "";
  }
}

async function invokeChatCompletion({ apiKey, baseUrl, model, messages, maxTokens }) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`模型接口调用失败：${message}`);
  }

  return data;
}

function getShichen(hour) {
  const mapping = [
    { start: 23, end: 24, name: "子时" },
    { start: 0, end: 1, name: "子时" },
    { start: 1, end: 3, name: "丑时" },
    { start: 3, end: 5, name: "寅时" },
    { start: 5, end: 7, name: "卯时" },
    { start: 7, end: 9, name: "辰时" },
    { start: 9, end: 11, name: "巳时" },
    { start: 11, end: 13, name: "午时" },
    { start: 13, end: 15, name: "未时" },
    { start: 15, end: 17, name: "申时" },
    { start: 17, end: 19, name: "酉时" },
    { start: 19, end: 21, name: "戌时" },
    { start: 21, end: 23, name: "亥时" }
  ];

  const match = mapping.find((item) => hour >= item.start && hour < item.end);
  return match ? match.name : "未知时辰";
}

const SYSTEM_PROMPT = [
  "你是一位东方气质灵感卡文案助手。",
  "请始终使用简体中文回答。",
  "不要输出思考过程、推理标签或中间草稿。",
  "分析内容仅限传统文化学习和娱乐参考。",
  "不要做算命式表达，不要做具体吉凶、运势、命定判断。",
  "不得提供医疗、投资、法律等专业建议。",
  "不得使用绝对化措辞，例如“保证”“必定”“百分百”。"
].join("\n");

function clampSectionLength(text) {
  const sections = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const shortened = sections.map((line) => {
    if (line.startsWith("【免责声明】")) {
      return line;
    }

    if (line === "仅供娱乐与传统文化灵感参考。" || line === "以上内容仅供娱乐和传统文化学习参考，不构成医疗、投资、法律等专业建议。") {
      return "仅供娱乐与传统文化灵感参考。";
    }

    if (!line.startsWith("【")) {
      return line.length > 24 ? `${line.slice(0, 24)}...` : line;
    }

    return line;
  });

  return shortened.join("\n");
}
