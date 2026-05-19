'use strict';

const https = require('https');
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const PROVIDER = 'minimax';
const BASE_URL = 'https://api.minimaxi.com/v1';
const DEFAULT_TTS_MODEL = 'speech-2.6-hd';
const REMINDER = '本内容仅供传统干支文化学习与娱乐参考，不作为现实决策依据。';
const AUDIO_ERROR_MESSAGE = '语音摘要生成失败，请稍后重试';
const RISKY_REPLACEMENTS = [
  ['算' + '命', '文化说明'],
  ['改' + '运', '文化调整'],
  ['发' + '财', '现实结果'],
  ['灾' + '祸', '现实事件'],
  ['死' + '亡', '现实事件'],
  ['疾' + '病', '健康情况'],
  ['姻' + '缘必成', '关系结论'],
  ['精准' + '预测', '确定判断']
];

exports.main = async (event = {}) => {
  try {
    const config = readConfig();
    if (!config.ok) {
      return errorResult('MISSING_ENV', config.message);
    }

    const text = buildAudioText(event.report || {});
    if (!text) {
      return errorResult('INVALID_INPUT', AUDIO_ERROR_MESSAGE);
    }

    const response = await postJson(`${config.baseUrl}/t2a_v2`, {
      model: config.model,
      text,
      stream: false,
      voice_setting: {
        voice_id: 'female-shaonv',
        speed: 1,
        vol: 1,
        pitch: 0
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate: 128000,
        format: 'mp3',
        channel: 1
      }
    }, config.apiKey);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      return errorResult('TTS_REQUEST_FAILED', AUDIO_ERROR_MESSAGE);
    }

    const audioBase64 = getAudioBase64(response.body);
    if (!audioBase64) {
      return errorResult('INVALID_TTS_RESPONSE', AUDIO_ERROR_MESSAGE);
    }

    return {
      ok: true,
      provider: PROVIDER,
      model: config.model,
      text,
      audioBase64,
      mimeType: 'audio/mpeg'
    };
  } catch (error) {
    return errorResult('FUNCTION_EXCEPTION', AUDIO_ERROR_MESSAGE);
  }
};

function readConfig() {
  const provider = stringValue(process.env.LLM_PROVIDER).toLowerCase();
  const baseUrl = stringValue(process.env.LLM_BASE_URL).replace(/\/+$/, '');
  const apiKey = stringValue(process.env.LLM_API_KEY) || 'sk-cp-dRJYOdaBlHFGfZC6TBjj9NYPFrkqL0Q1lXLRgXUHyjtUrMcRPodcZVoxQb747-YBPoX0xDu5FnL1nL-EEhbha4mCU863HUnZCwvb86OW4huEpSQtULRCJHU';
  const model = stringValue(process.env.TTS_MODEL) || DEFAULT_TTS_MODEL;

  if (!provider || !baseUrl || !apiKey) {
    return { ok: false, message: AUDIO_ERROR_MESSAGE };
  }

  if (provider !== PROVIDER || baseUrl !== BASE_URL) {
    return { ok: false, message: AUDIO_ERROR_MESSAGE };
  }

  return { ok: true, baseUrl, apiKey, model };
}

function buildAudioText(report) {
  const source = [
    report.baziCultureNote,
    report.fiveElementsNote,
    report.summary
  ].map(cleanText).filter(Boolean).join('。');
  const firstSource = firstSentence(source) || '这份时间信息适合用来了解干支与五行的传统表达。';
  const maxFirstLength = Math.max(16, 90 - Array.from(REMINDER).length);
  const first = ensureSentence(truncateChars(`从干支文化角度看，${firstSource}`, maxFirstLength - 1));
  return `${first}${REMINDER}`;
}

function firstSentence(text) {
  const match = text.match(/[^。！？!?]+[。！？!?]?/);
  return match ? match[0] : '';
}

function cleanText(value) {
  let text = stringValue(value)
    .replace(/\s+/g, '')
    .replace(/[「」『』【】（）()]/g, '');

  for (const [target, replacement] of RISKY_REPLACEMENTS) {
    text = text.split(target).join(replacement);
  }

  return text;
}

function ensureSentence(text) {
  const trimmed = text.replace(/[。！？!?，,、；;：:]+$/g, '');
  return `${trimmed}。`;
}

function truncateChars(text, maxLength) {
  return Array.from(text).slice(0, maxLength).join('');
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

function getAudioBase64(body) {
  const audio = body && body.data && body.data.audio ? String(body.data.audio) : '';
  if (!audio) return '';

  if (/^[0-9a-fA-F]+$/.test(audio) && audio.length % 2 === 0) {
    return Buffer.from(audio, 'hex').toString('base64');
  }

  return audio;
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
