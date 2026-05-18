'use strict';

// 微信云函数：analyzeBazi
// 接收：birthday（YYYY-MM-DD）, hour（0-23）, gender（男/女）, location（出生地）
// 返回：八字分析结果

exports.main = async (event, context) => {
  const { birthday, hour, gender, location } = event;

  // 输入校验
  if (!birthday || !hour || !gender) {
    return { success: false, error: '缺少必要参数' };
  }

  // 调用大模型API（API Key 从环境变量读取）
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://api.moonshot.cn/v1';
  const model = process.env.LLM_MODEL || 'kimi-k2.5';

  if (!apiKey) {
    return { success: false, error: 'LLM_API_KEY 未配置' };
  }

  // 构建 system prompt（从原 bazi-skill 转换）
  const systemPrompt = `你是一位专业的中国传统八字命理分析专家。...

重要免责声明：
1. 本分析仅供娱乐和文化学习参考
2. 不构成医疗、投资、法律建议
3. 命运由个人努力决定，八字仅供参考
4. 不承诺任何改运、预测效果`;

  const userPrompt = `请分析以下八字：
生日：${birthday}
时辰：${hour}时（${getShichen(hour)}）
性别：${gender}
出生地：${location || '不详'}

请输出包含：年柱、月柱、日柱、时柱，以及五行分析、性格特点、事业建议等内容。`;

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
          { role: 'user', content: userPrompt }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'API 调用失败' };
    }

    const result = data.choices[0].message.content;

    // 添加免责声明
    const disclaimer = '\n\n--- 免责声明 ---\n本分析结果由 AI 生成，仅供娱乐和文化学习参考，不构成任何专业建议。命运由个人努力决定。';

    return {
      success: true,
      result: result + disclaimer
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

function getShichen(hour) {
  const periods = [
    [23, 1, '子时'], [1, 3, '丑时'], [3, 5, '寅时'], [5, 7, '卯时'],
    [7, 9, '辰时'], [9, 11, '巳时'], [11, 13, '午时'], [13, 15, '未时'],
    [15, 17, '申时'], [17, 19, '酉时'], [19, 21, '戌时'], [21, 23, '亥时']
  ];
  const h = parseInt(hour);
  for (const [start, end, name] of periods) {
    if (start === 23 && h >= 23) return name;
    if (h >= start && h < end) return name;
  }
  return '丑时';
}
