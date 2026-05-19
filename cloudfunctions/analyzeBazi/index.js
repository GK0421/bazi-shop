'use strict';

const https = require('https');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const PROVIDER = 'minimax';
const MODEL = 'MiniMax-M2.7';
const DISCLAIMER = "本内容仅供传统干支文化学习与娱乐参考，不构成医疗、投资、婚姻、职业或其他现实决策依据。";

// 错误码
const ERR = {
  MISSING_ENV:      'MISSING_ENV',
  INVALID_INPUT:    'INVALID_INPUT',
  LLM_REQUEST_FAILED: 'LLM_REQUEST_FAILED',
  INVALID_LLM_RESPONSE: 'INVALID_LLM_RESPONSE',
  FUNCTION_EXCEPTION: 'FUNCTION_EXCEPTION'
};

exports.main = async (event) => {
  try {
    // ── 1. 读取配置：优先环境变量，fallback 为内嵌值（部署后腾讯云自动读取环境变量）───
    const baseUrl = (process.env.LLM_BASE_URL || 'https://api.minimax.chat/v1').replace(/\/+$/, '');
    const envApiKey = process.env.LLM_API_KEY;
    // 部署时优先读取云函数环境变量；本地测试/未配置时用以下 fallback
    const apiKey = envApiKey && envApiKey.trim() ? envApiKey.trim()
               : 'sk-cp-dRJYOdaBlHFGfZC6TBjj9NYPFrkqL0Q1lXLRgXUHyjtUrMcRPodcZVoxQb747-YBPoX0xDu5FnL1nL-EEhbha4mCU863HUnZCwvb86OW4huEpSQtULRCJHU';

    if (!baseUrl) {
      return errorResult(ERR.MISSING_ENV, '请先在云函数配置中填写 LLM_BASE_URL 环境变量。');
    }

    // ── 2. 输入校验 ──────────────────────────────────────────────────────────
    const input = {
      birthday:  (event.birthday  || '').trim(),
      hour:      (event.hour      || '').trim(),
      gender:    (event.gender    || '').trim(),
      location:  (event.location   || '').trim(),
      name:      (event.name      || '').trim()
    };
    if (!input.birthday) return errorResult(ERR.INVALID_INPUT, '请填写阳历生日。');
    if (!input.hour)     return errorResult(ERR.INVALID_INPUT, '请填写出生时间。');
    if (!input.gender)   return errorResult(ERR.INVALID_INPUT, '请填写性别。');

    // ── 3. 调用 MiniMax ──────────────────────────────────────────────────────
    const url = baseUrl + '/chat/completions';
    const postBody = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user',   content: buildUserPrompt(input) }
      ],
      temperature: 0.45,
      max_tokens: 900
    });

    const response = await requestJson(url, postBody, apiKey);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return errorResult(ERR.LLM_REQUEST_FAILED, '模型服务暂时没有返回可用结果，请稍后再试。');
    }

    // ── 4. 解析结果 ───────────────────────────────────────────────────────────
    const text = getMessageText(response.body);
    if (!text) {
      return errorResult(ERR.INVALID_LLM_RESPONSE, '模型返回内容暂时无法展示，请稍后再试。');
    }

    const report = parseReport(text);
    if (!report) {
      return errorResult(ERR.INVALID_LLM_RESPONSE, '模型返回格式异常，请稍后再试。');
    }

    return { ok: true, input, provider: PROVIDER, model: MODEL, report };

  } catch (err) {
    return errorResult(ERR.FUNCTION_EXCEPTION, '云函数暂时不可用，请稍后再试。');
  }
};

// ── prompt 构建 ────────────────────────────────────────────────────────────────
function buildSystemPrompt() {
  return [
    '你是传统干支文化学习助手。',
    '请只从天干、地支、节气、五行和民俗文化角度做温和说明。',
    '内容只用于文化学习和娱乐参考，不输出现实决策结论，不使用确定性承诺。',
    '不要给出发财、改运、化解、疾病、死亡、灾祸、婚恋确定性预测、投资建议、医疗建议。',
    '不要使用"一定""必定""注定""保证"等确定性表达。',
    '请输出严格 JSON，不要输出 Markdown 或任何解释性文字。',
    'JSON 必须包含 title、summary、baziCultureNote、fiveElementsNote、disclaimer 五个字段。',
    'disclaimer 固定为：' + DISCLAIMER
  ].join('\n');
}

function buildUserPrompt(input) {
  const fields = [
    '阳历生日：' + input.birthday,
    '出生时间：' + input.hour,
    '性别：' + input.gender,
    '出生地：' + (input.location || '未填写'),
    '姓名：' + (input.name       || '未填写')
  ].join('\n');
  return [
    '请根据以下信息生成传统干支文化学习说明（严格 JSON）：',
    fields,
    'title: 一个简洁的传统文化角度标题',
    'summary: 整体文化印象和学习角度说明（100字以内，温和克制）',
    'baziCultureNote: 干支记录时间的文化含义（50字以内）',
    'fiveElementsNote: 五行分类的学习角度说明（50字以内）'
  ].join('\n');
}

// ── HTTP 工具 ────────────────────────────────────────────────────────────────
function requestJson(url, postBody, apiKey) {
  return new Promise((resolve, reject) => {
    const pu = new URL(url);
    const req = https.request({
      hostname: pu.hostname,
      path:     pu.pathname + pu.search,
      method:   'POST',
      timeout:  15000,
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(postBody)
      }
    }, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        let body = {};
        try { body = JSON.parse(raw); } catch (_) {}
        resolve({ statusCode: res.statusCode || 0, body });
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error',   (e) => { reject(e); });
    req.write(postBody);
    req.end();
  });
}

// ── 响应解析 ─────────────────────────────────────────────────────────────────
function getMessageText(body) {
  try {
    const choice = body && Array.isArray(body.choices) ? body.choices[0] : null;
    const msg    = choice && choice.message ? choice.message : null;
    if (!msg || !msg.content) return '';
    const c = msg.content;
    if (typeof c === 'string') return c.trim();
    if (Array.isArray(c)) {
      return c.map((p) => {
        if (typeof p === 'string') return p;
        if (p && p.text)    return p.text;
        if (p && p.content) return p.content;
        return '';
      }).join('').trim();
    }
    return String(c).trim();
  } catch (_) { return ''; }
}

function parseReport(text) {
  const parsed = parseJson(text);
  if (!parsed) return null;
  const report = {
    title:          cleanText(parsed.title          || '传统干支文化学习说明'),
    summary:        cleanText(parsed.summary        || ''),
    baziCultureNote:    cleanText(parsed.baziCultureNote    || ''),
    fiveElementsNote:   cleanText(parsed.fiveElementsNote   || ''),
    disclaimer:     DISCLAIMER
  };
  // 至少需要 summary
  if (!report.summary) return null;
  return report;
}

function parseJson(text) {
  if (!text) return null;
  // 去除 markdown 代码块
  let cleaned = String(text)
    .replace(/<\/?think>[\s\S]*?<\/?think>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 候选字符串
  const candidates = [cleaned];
  const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) candidates.push(fenced[1].trim());

  // 找到第一个 {...} 块
  const start = cleaned.indexOf('{');
  if (start >= 0) {
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (esc)       { esc = false;  continue; }
      if (ch === '\\') { esc = true;  continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (depth === 0) {
        candidates.push(cleaned.slice(start, i + 1));
        break;
      }
    }
  }

  for (const c of [...new Set(candidates.filter(Boolean))]) {
    try { return JSON.parse(c); } catch (_) {}
  }
  return null;
}

function cleanText(v) {
  if (!v) return '';
  return String(v)
    .replace(/一定/g,   '可以理解为')
    .replace(/必然/g,   '可以理解为')
    .replace(/注定/g,   '可以理解为')
    .replace(/保证/g,   '可以理解为')
    .replace(/发财/g,   '祝您生活愉快')
    .replace(/改运/g,   '传统文化学习')
    .replace(/暴富/g,   '祝您生活愉快')
    .replace(/化解/g,   '请咨询专业人士')
    .replace(/灾祸/g,   '请注意安全')
    .replace(/疾病/g,   '请注意健康')
    .replace(/死亡/g,   '请珍爱生命')
    .trim();
}

// ── 错误返回 ──────────────────────────────────────────────────────────────────
function errorResult(err, msg) {
  return {
    ok: false,
    provider: PROVIDER,
    model: MODEL,
    error: err,
    message: msg,
    // 前端 result.js 期望 report 结构，错误时也保持一致
    report: {
      title: '分析暂不可用',
      summary: msg,
      baziCultureNote: '',
      fiveElementsNote: '',
      disclaimer: DISCLAIMER
    }
  };
}
