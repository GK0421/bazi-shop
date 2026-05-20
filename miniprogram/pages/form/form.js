const app = getApp();
const apiConfig = require('../../utils/api-config.js');

const DISCLAIMER = "本内容仅供传统干支文化学习与娱乐参考，不构成医疗、投资、婚姻、职业或其他现实决策依据。";

const LOADING_TEXTS = [
  '翻阅历书...', '查找节气...', '排布天干...',
  '推演地支...', '整理五行...', '书写札记...'
];

Page({
  data: {
    birthday: '',
    hourIndex: -1,
    hourOptions: [
      '00:00-00:59 子时', '01:00-02:59 丑时', '03:00-04:59 寅时',
      '05:00-06:59 卯时', '07:00-08:59 辰时', '09:00-10:59 巳时',
      '11:00-12:59 午时', '13:00-14:59 未时', '15:00-16:59 申时',
      '17:00-18:59 酉时', '19:00-20:59 戌时', '21:00-22:59 亥时',
      '23:00-23:59 子时'
    ],
    gender: '',
    location: '',
    name: '',
    loading: false,
    loadingText: '正在翻阅老黄历...',
    error: '',
    _timer: null
  },

  onBirthdayChange(e) { this.setData({ birthday: e.detail.value, error: '' }); },
  onHourChange(e)    { this.setData({ hourIndex: Number(e.detail.value), error: '' }); },
  onGenderChange(e)  { this.setData({ gender: e.detail.value, error: '' }); },
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value, error: '' });
  },

  startLoadingAnimation() {
    let i = 0;
    const timer = setInterval(() => {
      this.setData({ loadingText: LOADING_TEXTS[i % LOADING_TEXTS.length] });
      i++;
    }, 1800);
    this.setData({ loadingText: '正在翻阅老黄历...', _timer: timer });
  },

  stopLoadingAnimation() {
    if (this.data._timer) { clearInterval(this.data._timer); this.data._timer = null; }
  },

  buildPrompt(input) {
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
      '',
      '用户信息：',
      '生日：' + input.birthday,
      '时辰：' + input.hour,
      '性别：' + input.gender,
      '出生地：' + (input.location || '未提供')
    ].join('\n');
  },

  parseReport(text) {
    // 去除 think 标签
    let cleaned = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (!cleaned) cleaned = String(text || '').trim();
    
    const titleMatch = cleaned.match(/【文化概述】([\s\S]*?)(?=【|$)/);
    const baziMatch  = cleaned.match(/【干支时间解读】([\s\S]*?)(?=【|$)/);
    const fiveMatch  = cleaned.match(/【五行分类参考】([\s\S]*?)(?=【|$)/);

    return {
      title: '传统干支文化参考',
      summary: (titleMatch ? titleMatch[1].trim() : cleaned.substring(0, 150).trim()) || '传统文化学习说明',
      baziCultureNote: (baziMatch ? baziMatch[1].trim() : '干支文化常用天干、地支与节气来记录时间。') || '干支文化学习参考',
      fiveElementsNote: (fiveMatch ? fiveMatch[1].trim() : '五行是传统文化中的分类方式。') || '五行文化学习参考',
      disclaimer: DISCLAIMER
    };
  },

  async submit() {
    const input = this.buildInput();
    const msg = this.validate(input);
    if (msg) { this.setData({ error: msg }); return; }

    // 检查 API Key
    if (!apiConfig.MINIMAX_API_KEY || apiConfig.MINIMAX_API_KEY.indexOf('PASTE') > -1) {
      this.setData({ error: '请先在 miniprogram/utils/api-config.js 中填入 MiniMax API Key。' });
      return;
    }

    this.setData({ loading: true, error: '' });
    this.startLoadingAnimation();

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: apiConfig.MINIMAX_BASE_URL + '/chat/completions',
          method: 'POST',
          header: {
            'Authorization': 'Bearer ' + apiConfig.MINIMAX_API_KEY,
            'Content-Type': 'application/json'
          },
          data: {
            model: apiConfig.MINIMAX_MODEL || 'MiniMax-M2.7',
            messages: [{ role: 'user', content: this.buildPrompt(input) }],
            temperature: 0.5,
            max_tokens: 400
          },
          timeout: 45000,
          success: resolve,
          fail: reject
        });
      });

      if (res.statusCode < 200 || res.statusCode >= 300) {
        this.setData({ loading: false, error: '模型服务暂时不可用（' + res.statusCode + '），请稍后再试。' });
        this.stopLoadingAnimation();
        return;
      }

      const body = res.data;
      const choices = body && body.choices;
      const content = choices && choices[0] && choices[0].message && choices[0].message.content;
      
      if (!content) {
        this.setData({ loading: false, error: '模型返回了空内容，请稍后再试。' });
        this.stopLoadingAnimation();
        return;
      }

      const report = this.parseReport(content);
      if (!report || !report.summary) {
        this.setData({ loading: false, error: '内容解析失败，请稍后再试。' });
        this.stopLoadingAnimation();
        return;
      }

      const result = {
        ok: true,
        input: input,
        provider: 'minimax',
        model: apiConfig.MINIMAX_MODEL || 'MiniMax-M2.7',
        report: report
      };

      app.globalData.latestBaziResult = result;
      wx.navigateTo({ url: '/pages/result/result' });

    } catch (err) {
      console.error('MiniMax request error:', err);
      this.setData({ loading: false, error: '网络请求失败，请检查网络后重试。' });
    } finally {
      this.stopLoadingAnimation();
      this.setData({ loading: false });
    }
  },

  buildInput() {
    return {
      birthday: this.data.birthday,
      hour:     this.data.hourIndex >= 0 ? this.data.hourOptions[this.data.hourIndex] : '',
      gender:   this.data.gender,
      location: this.data.location.trim(),
      name:     this.data.name.trim()
    };
  },

  validate(input) {
    if (!input.birthday) return '请选择阳历生日。';
    if (!input.hour)     return '请选择出生时间。';
    if (!input.gender)   return '请选择性别。';
    return '';
  }
});
