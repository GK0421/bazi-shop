'use strict';

const https = require('https');
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const PROVIDER = 'minimax';
const MODEL = 'MiniMax-M2.7';
const BASE_URL = 'https://api.minimaxi.com/v1';
const DISCLAIMER = '本内容仅供传统干支文化学习与娱乐参考，不构成医疗、投资、婚姻、职业或其他现实决策依据。';

exports.main = async (event = {}) => {
  try {
    const input = normalizeInput(event);
    const inputError = validateInput(input);

    if (inputError) {
      return errorResult('INVALID_INPUT', inputError);
    }

    const config = readConfig();
    if (!config.ok) {
      return errorResult('MISSING_ENV', config.message);
    }

    const response = await postJson(`${config.baseUrl}/chat/completions`, {
      model: config.model,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(input) }
      ],
      temperature: 0.45,
      max_tokens: 900
    }, config.apiKey);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return errorResult('LLM_REQUEST_FAILED', '模型服务暂时没有返回可用结果，请稍后再试。');
    }

    const text = getMessageText(response.body);
    const report = parseReport(text);

    if (!report) {
      return errorResult('INVALID_LLM_RESPONSE', '模型返回内容暂时无法展示，请稍后再试。');
    }

    return {
      ok: true,
      input,
      provider: PROVIDER,
      model: MODEL,
      report
    };
  } catch (error) {
    return errorResult('FUNCTION_EXCEPTION', '云函数暂时不可用，请稍后再试。');
  }
};

function readConfig() {
  const provider = stringValue(process.env.LLM_PROVIDER).toLowerCase();
  const baseUrl = stringValue(process.env.LLM_BASE_URL).replace(/\/+$/, '');
  const model = stringValue(process.env.LLM_MODEL);
  const apiKey = stringValue(process.env.LLM_API_KEY);

  if (!provider || !baseUrl || !model || !apiKey) {
    return { ok: false, message: '请先配置 LLM_PROVIDER、LLM_BASE_URL、LLM_MODEL、LLM_API_KEY。' };
  }

  if (provider !== PROVIDER || baseUrl !== BASE_URL || model !== MODEL) {
    return { ok: false, message: '请使用 MiniMax-M2.7 和 https://api.minimaxi.com/v1。' };
  }

  return { ok: true, baseUrl, model, apiKey };
}

function normalizeInput(event) {
  return {
    birthday: stringValue(event.birthday),
    hour: stringValue(event.hour),
    gender: stringValue(event.gender),
    location: stringValue(event.location),
    name: stringValue(event.name)
  };
}

function validateInput(input) {
  if (!input.birthday) return '请填写阳历生日。';
  if (!input.hour) return '请填写出生时间。';
  if (!input.gender) return '请填写性别。';
  return '';
}

function buildSystemPrompt() {
  return [
    '你是传统干支文化学习助手。',
    '请只从天干、地支、节气、五行和民俗文化角度做温和说明。',
    '内容只用于文化学习和娱乐参考，不输出现实决策结论，不使用确定性承诺。',
    '请输出严格 JSON，不要输出 Markdown。',
    'JSON 字段必须包含 title、summary、baziCultureNote、fiveElementsNote、disclaimer。',
    `disclaimer 必须固定为：${DISCLAIMER}`
  ].join('\n');
}

function buildUserPrompt(input) {
  return [
    '请根据以下信息生成传统干支文化学习说明：',
    `阳历生日：${input.birthday}`,
    `出生时间：${input.hour}`,
    `性别：${input.gender}`,
    `出生地：${input.location || '未填写'}`,
    `姓名：${input.name || '未填写'}`,
    'summary 说明整体文化印象。',
    'baziCultureNote 说明干支记录时间的文化含义。',
    'fiveElementsNote 说明五行分类的学习角度。'
  ].join('\n');
}

function postJson(url, body, apiKey) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const rawBody = JSON.stringify(body);
    const request = https.request({
      method: 'POST',
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(rawBody)
      }
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        try {
          resolve({
            statusCode: response.statusCode || 0,
            body: raw ? JSON.parse(raw) : {}
          });
        } catch (error) {
          resolve({
            statusCode: response.statusCode || 0,
            body: {}
          });
        }
      });
    });

    request.on('error', reject);
    request.write(rawBody);
    request.end();
  });
}

function getMessageText(body) {
  const choice = body && Array.isArray(body.choices) ? body.choices[0] : null;
  const message = choice && choice.message ? choice.message : null;
  if (!message || !message.content) return '';

  if (typeof message.content === 'string') {
    return message.content.trim();
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        if (part && typeof part.content === 'string') return part.content;
        return '';
      })
      .join('')
      .trim();
  }

  return String(message.content).trim();
}

function parseReport(text) {
  const parsed = parseJson(text);

  if (!parsed) {
    return null;
  }

  const report = {
    title: cleanText(parsed.title) || '传统干支文化学习说明',
    summary: cleanText(parsed.summary),
    baziCultureNote: cleanText(parsed.baziCultureNote),
    fiveElementsNote: cleanText(parsed.fiveElementsNote),
    disclaimer: DISCLAIMER
  };

  if (!report.summary || !report.baziCultureNote || !report.fiveElementsNote) {
    return null;
  }

  return report;
}

function parseJson(text) {
  if (!text) return null;

  const candidates = buildJsonCandidates(text);
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // Try the next candidate.
    }
  }

  return null;
}

function buildJsonCandidates(text) {
  const cleaned = String(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const candidates = [cleaned];
  const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fenced && fenced[1]) {
    candidates.push(fenced[1].trim());
  }

  const balanced = extractBalancedJson(cleaned);
  if (balanced) {
    candidates.push(balanced);
  }

  return [...new Set(candidates.filter(Boolean))];
}

function extractBalancedJson(text) {
  const start = text.indexOf('{');
  if (start < 0) return '';

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      return text.slice(start, index + 1);
    }
  }

  return '';
}

function cleanText(value) {
  return stringValue(value)
    .replace(/一定/g, '可以理解为')
    .replace(/必然/g, '可以理解为')
    .replace(/注定/g, '可以理解为')
    .replace(/保证/g, '可以理解为');
}

function errorResult(error, message) {
  return {
    ok: false,
    error,
    message
  };
}

function stringValue(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}
