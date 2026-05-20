'use strict';

const https = require('https');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const PROVIDER = 'minimax';
const MODEL = 'MiniMax-M2.7';
const DISCLAIMER = "本内容仅供传统干支文化学习与娱乐参考，不构成医疗、投资、婚姻、职业或其他现实决策依据。";

const ERR = {
  MISSING_ENV:      'MISSING_ENV',
  INVALID_INPUT:    'INVALID_INPUT',
  LLM_REQUEST_FAILED: 'LLM_REQUEST_FAILED',
  INVALID_LLM_RESPONSE: 'INVALID_LLM_RESPONSE',
  FUNCTION_EXCEPTION: 'FUNCTION_EXCEPTION'
};

exports.main = async (event) => {
  try {
    // 1. 读取配置
    const baseUrl = (process.env.LLM_BASE_URL || 'https://api.minimax.chat/v1').replace(/\/+$/, '');
    const envApiKey = process.env.LLM_API_KEY;
    const apiKey = envApiKey && envApiKey.trim() ? envApiKey.trim() : '';

    if (!apiKey) {
      return errorResult(ERR.MISSING_ENV, '请先在云开发控制台配置 LLM_API_KEY 环境变量。');
    }

    // 2. 输入校验
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

    // 3. 调用 MiniMax（轻量 prompt，减少 token 提升速度）
    const url = baseUrl + '/chat/completions';
    const postBody = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'user', content: buildSimplePrompt(input) }
      ],
      temperature: 0.5,
      max_tokens: 400,
      top_p: 0.9
    });

    const response = await requestJson(url, postBody, apiKey);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return errorResult(ERR.LLM_REQUEST_FAILED, '模型服务暂时没有返回可用结果，请稍后再试。');
    }

    // 4. 解析结果
    const text = getMessageText(response.body);
    if (!text) {
      return errorResult(ERR.INVALID_LLM_RESPONSE, '模型返回内容暂时无法展示，请稍后再试。');
    }

    const report = buildReport(text, input);
    if (!report) {
      return errorResult(ERR.INVALID_LLM_RESPONSE, '模型返回格式异常，请稍后再试。');
    }

    return { ok: true, input, provider: PROVIDER, model: MODEL, report };

  } catch (err) {
    return errorResult(ERR.FUNCTION_EXCEPTION, '云函数暂时不可用，请稍后再试。');
  }
};

// 简化 prompt - 一次性请求，不要求 JSON 格式（更快）
function buildSimplePrompt(input) {
  return [
    '你是传统干支文化助手。请用简体中文直接回复，不要用JSON格式。',
    '按以下结构分三段回复：',
    '',
    '【文化概述】',
    '用50字左右从传统文化角度温和描述这个出生时间',
    '',
    '【干支时间解读】',
    '用50字左右从干支、节气角度做文化学习说明',
    '',
    '【五行分类参考】',
    '用50字左右从五行分类角度做文化学习说明',
    '',
    '重要规则：',
    '- 不长于200字',
    '- 不要使用一定、必定、注定、保证等确定性表达',
    '- 不要给出发财、改运、疾病、死亡、灾祸、婚恋预测',
    '- 内容仅供文化学习与娱乐参考',
    '- 免责声明：' + DISCLAIMER,
    '',
    '用户信息：',
    '生日：' + input.birthday,
    '时辰：' + input.hour,
    '性别：' + input.gender,
    '出生地：' + (input.location || '未提供')
  ].join('\n');
}

// HTTP 工具
function requestJson(url, postBody, apiKey) {
  return new Promise((resolve, reject) => {
    const pu = new URL(url);
    const req = https.request({
      hostname: pu.hostname,
      path:     pu.pathname + pu.search,
      method:   'POST',
      timeout:  25000,
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

// 提取消息文本
function getMessageText(body) {
  try {
    const choice = body && Array.isArray(body.choices) ? body.choices[0] : null;
    const msg    = choice && choice.message ? choice.message : null;
    if (!msg || !msg.content) return '';
    const c = msg.content;
    if (typeof c === 'string') return cleanThinkTag(c).trim();
    if (Array.isArray(c)) {
      return cleanThinkTag(c.map(p => 
        typeof p === 'string' ? p : (p && p.text) || (p && p.content) || ''
      ).join('')).trim();
    }
    return cleanThinkTag(String(c)).trim();
  } catch (_) { return ''; }
}

function cleanThinkTag(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// 解析报告（非 JSON 格式 - 按段落拆分）
function buildReport(text, input) {
  const cleaned = cleanText(text);
  if (!cleaned) return null;

  // 按【】标题分拆
  const parts = {};
  const titleMatch = cleaned.match(/【文化概述】([\s\S]*?)(?=【|$)/);
  const baziMatch  = cleaned.match(/【干支时间解读】([\s\S]*?)(?=【|$)/);
  const fiveMatch  = cleaned.match(/【五行分类参考】([\s\S]*?)(?=【|$)/);

  parts.title = '传统干支文化参考';
  parts.summary = (titleMatch ? titleMatch[1].trim() : cleaned.substring(0, 150).trim()) || '传统文化学习说明';
  parts.baziCultureNote = (baziMatch ? baziMatch[1].trim() : '干支文化常用天干、地支与节气来记录时间。') || '干支文化学习参考';
  parts.fiveElementsNote = (fiveMatch ? fiveMatch[1].trim() : '五行是传统文化中的分类方式。') || '五行文化学习参考';

  return {
    title: parts.title,
    summary: parts.summary,
    baziCultureNote: parts.baziCultureNote,
    fiveElementsNote: parts.fiveElementsNote,
    disclaimer: DISCLAIMER
  };
}

// 文本清洁
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

// 错误返回
function errorResult(err, msg) {
  return {
    ok: false,
    provider: PROVIDER,
    model: MODEL,
    error: err,
    message: msg,
    report: {
      title: '分析暂不可用',
      summary: msg,
      baziCultureNote: '',
      fiveElementsNote: '',
      disclaimer: DISCLAIMER
    }
  };
}
