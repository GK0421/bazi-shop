'use strict';

// 微信云函数：analyzeBazi
// 接收参数：birthday（YYYY-MM-DD）, hour（0-23）, gender（男/女）, location（出生地）
// 调用 MiniMax 大模型 API（MiniMax-M2.7）

exports.main = async (event, context) => {
  const { birthday, hour, gender, location } = event;

  // ── 1. 输入校验 ────────────────────────────────────────────
  if (!birthday || !gender) {
    return { success: false, error: '缺少必要参数（birthday, gender）' };
  }

  const hourNum = parseInt(hour);
  if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
    return { success: false, error: '时辰参数无效（需 0-23）' };
  }

  if (String(location || '').length > 100) {
    return { success: false, error: '出生地长度超出限制（最多100字符）' };
  }

  // ── 2. 大模型 API 调用 ────────────────────────────────────
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.minimax.chat/v1';
  const model   = process.env.LLM_MODEL || 'MiniMax-M2.7';

  if (!apiKey) {
    return { success: false, error: 'LLM_API_KEY 未配置，请联系管理员' };
  }

  // system prompt（强制中文输出）
  const systemPrompt = `你是一位专业的中国传统八字命理分析专家，精通五行、十神、大运、流年等体系。

【语言要求】必须用简体中文回答，所有输出必须是中文。

【分析要求】
根据用户提供的生日、时辰、性别、出生地，计算并分析八字：
- 排出年柱、月柱、日柱、时柱（天干地支）
- 分析五行分布与旺弱
- 分析十神象征与性格特点
- 给出事业、感情方面的大致建议（仅供参考）

【免责声明（必须附加在回复末尾）】
以下分析结果由 AI 生成，仅供娱乐和文化学习参考，不构成医疗、投资、法律等专业建议。命运由个人努力决定，请理性看待。

【严格禁止】
- 不得承诺改运、化解、算命准不准
- 不得预测具体死亡日期或灾难
- 不得提供医疗或投资建议
- 不得使用"一定"、"必定"、"保证"等绝对化语气`;

  const userPrompt = `请分析以下八字信息：

生日：${birthday}
时辰：${hourNum}时（${getShichen(hourNum)}）
性别：${gender}
出生地：${location || '不详'}

请用简体中文输出分析结果。`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.error?.message || `HTTP ${response.status}`;
      return { success: false, error: `API 调用失败：${msg}` };
    }

    const result = data.choices[0].message.content;

    // ── 3. 输出审查 ────────────────────────────────────────────
    const banned = ['保证', '一定', '必定', '改运', '化解', '算命准', '死亡日期', '医疗建议', '投资建议'];
    let safeResult = result;
    for (const word of banned) {
      if (safeResult.includes(word)) {
        safeResult = safeResult.replace(/./g, '*');
        safeResult += '\n\n[系统提示：检测到输出内容异常，已做脱敏处理]';
        break;
      }
    }

    return {
      success: true,
      birthday, hour: hourNum, gender, location,
      result: safeResult,
      model_used: model,
      request_id: data.id || 'local-test'
    };

  } catch (err) {
    return { success: false, error: `网络异常：${err.message}` };
  }
};

// ── 时辰地支转换 ────────────────────────────────────────────
function getShichen(hour) {
  const map = [
    [23, 1, '子时'], [1, 3, '丑时'], [3, 5, '寅时'], [5, 7, '卯时'],
    [7, 9, '辰时'],  [9, 11, '巳时'], [11, 13, '午时'], [13, 15, '未时'],
    [15, 17, '申时'], [17, 19, '酉时'], [19, 21, '戌时'], [21, 23, '亥时']
  ];
  for (const [start, end, name] of map) {
    if (start === 23 && hour >= 23) return name;
    if (hour >= start && hour < end) return name;
  }
  return '丑时';
}
