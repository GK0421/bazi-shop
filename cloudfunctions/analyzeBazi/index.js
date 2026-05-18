'use strict';

const http = require('http');
const https = require('https');
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const DEFAULT_PROVIDER = 'minimax';
const REQUIRED_MODEL = 'MiniMax-M2.7';
const DEFAULT_DISCLAIMER = '本内容仅用于传统干支文化学习和娱乐参考，不构成现实决策依据。请理性看待，重要事项请以现实信息和专业意见为准。';
const BANNED_PATTERNS = [
  /发财/,
  /暴富/,
  /改运/,
  /转运/,
  /化解/,
  /疾病/,
  /死亡/,
  /灾祸/,
  /灾难/,
  /婚恋.*(一定|必定|确定|注定)/,
  /(一定|必定|确定|注定).*(结婚|离婚|分手|复合|婚恋)/,
  /保证/,
  /必然/
];

exports.main = async (event = {}) => {
  const input = normalizeInput(event);
  const config = readConfig();

  if (!config.ok) {
    return {
      ok: false,
      input,
      provider: DEFAULT_PROVIDER,
      model: REQUIRED_MODEL,
      report: {
        title: '配置缺失',
        summary: config.message,
        disclaimer: DEFAULT_DISCLAIMER
      }
    };
  }

  // Validate required input fields
  if (!input.birthday || !input.hour || !input.gender) {
    return {
      ok: false,
      input,
      provider: DEFAULT_PROVIDER,
      model: REQUIRED_MODEL,
      report: {
        title: '信息不完整',
        summary: '请填写生日、出生时辰和性别。',
        disclaimer: DEFAULT_DISCLAIMER
      }
    };
  }

  try {
    const response = await postJson(`${config.baseUrl}/chat/completions`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`
      },
      body: {
        model: REQUIRED_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(input) }
        ],
        temperature: 0.6,
        max_tokens: 900
      }
    });

    const data = response.body;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return {
        ok: false,
        input,
        provider: DEFAULT_PROVIDER,
        model: REQUIRED_MODEL,
        report: {
          title: '分析暂不可用',
          summary: '模型服务暂时没有返回可用结果，请稍后再试。',
          disclaimer: DEFAULT_DISCLAIMER
        }
      };
    }

    const text = data && data.choices && data.choices[0] && data.choices[0].message
      ? String(data.choices[0].message.content || '')
      : '';

    return {
      ok: true,
      input,
      provider: DEFAULT_PROVIDER,
      model: REQUIRED_MODEL,
      report: buildReport(text)
    };
  } catch (error) {
    return {
      ok: false,
      input,
      provider: DEFAULT_PROVIDER,
      model: REQUIRED_MODEL,
      report: {
        title: '分析暂不可用',
        summary: '模型服务连接失败，请稍后再试。',
        disclaimer: DEFAULT_DISCLAIMER
      }
    };
  }
};

function postJson(url, options) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = JSON.stringify(options.body || {});
    const transport = target.protocol === 'http:' ? http : https;

    const request = transport.request({
      method: 'POST',
      hostname: target.hostname,
      port: target.port || undefined,
      path: `${target.pathname}${target.search}`,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...options.headers
      }
    }, (response) => {
      let raw = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        raw += chunk;
      });
      response.on('end', () => {
        let parsed = {};
        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch (error) {
          parsed = {};
        }
        resolve({ statusCode: response.statusCode || 0, body: parsed });
      });
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function readConfig() {
  const provider = String(process.env.LLM_PROVIDER || '').trim().toLowerCase();
  const baseUrl = String(process.env.LLM_BASE_URL || '').trim().replace(/\/+$/, '');
  const model = String(process.env.LLM_MODEL || '').trim();
  const apiKey = String(process.env.LLM_API_KEY || '').trim();

  if (!provider || !baseUrl || !model || !apiKey) {
    return { ok: false, message: '请先配置 LLM_PROVIDER、LLM_BASE_URL、LLM_MODEL、LLM_API_KEY。' };
  }

  if (provider !== DEFAULT_PROVIDER) {
    return { ok: false, message: '当前云函数仅支持 minimax 服务。' };
  }

  if (model !== REQUIRED_MODEL) {
    return { ok: false, message: '当前云函数仅支持 MiniMax-M2.7 模型。' };
  }

  return { ok: true, baseUrl, apiKey };
}

function normalizeInput(event) {
  return {
    birthday: stringValue(event.birthday),
    hour: stringValue(event.hour),
    gender: stringValue(event.gender),
    location: stringValue(event.location)
  };
}

function stringValue(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

function buildSystemPrompt() {
  return [
    '你是传统干支文化学习助手。',
    '请只从传统干支、五行、节气与民俗文化角度做学习和娱乐参考。',
    '不要给出发财、改运、疾病、死亡、灾祸、婚恋确定性预测。',
    '不要使用一定、必定、注定、保证等确定性表达。',
    '请用简体中文输出一个 JSON 对象，只包含 title、summary、disclaimer 三个字符串字段。',
    `disclaimer 固定使用：${DEFAULT_DISCLAIMER}`
  ].join('\n');
}

function buildUserPrompt(input) {
  return [
    '请基于以下信息生成传统干支文化学习参考：',
    `生日：${input.birthday || '未提供'}`,
    `时辰：${input.hour || '未提供'}`,
    `性别：${input.gender || '未提供'}`,
    `出生地：${input.location || '未提供'}`,
    'summary 请保持温和、克制、非确定性，只用于文化学习和娱乐参考。'
  ].join('\n');
}

function buildReport(text) {
  const parsed = parseJsonObject(text);
  const report = {
    title: sanitizeText(parsed.title || '传统干支文化参考'),
    summary: sanitizeText(parsed.summary || text || '暂未生成有效内容，请稍后再试。'),
    disclaimer: DEFAULT_DISCLAIMER
  };

  if (!report.summary) {
    report.summary = '暂未生成有效内容，请稍后再试。';
  }

  return report;
}

function parseJsonObject(text) {
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};

    try {
      return JSON.parse(match[0]);
    } catch (innerError) {
      return {};
    }
  }
}

function sanitizeText(text) {
  let result = String(text || '').trim();
  for (const pattern of BANNED_PATTERNS) {
    result = result.replace(pattern, '相关现实判断');
  }
  return result;
}
