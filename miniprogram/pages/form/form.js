const app = getApp();

Page({
  data: {
    birthday: '',
    hourIndex: -1,
    hourOptions: [
      '00:00-00:59 子时',
      '01:00-02:59 丑时',
      '03:00-04:59 寅时',
      '05:00-06:59 卯时',
      '07:00-08:59 辰时',
      '09:00-10:59 巳时',
      '11:00-12:59 午时',
      '13:00-14:59 未时',
      '15:00-16:59 申时',
      '17:00-18:59 酉时',
      '19:00-20:59 戌时',
      '21:00-22:59 亥时',
      '23:00-23:59 子时'
    ],
    gender: '',
    location: '',
    name: '',
    loading: false,
    error: ''
  },

  onBirthdayChange(event) {
    this.setData({ birthday: event.detail.value, error: '' });
  },

  onHourChange(event) {
    this.setData({ hourIndex: Number(event.detail.value), error: '' });
  },

  onGenderChange(event) {
    this.setData({ gender: event.detail.value, error: '' });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value, error: '' });
  },

  async submit() {
    const input = this.buildInput();
    const message = this.validate(input);
    if (message) {
      this.setData({ error: message });
      return;
    }

    if (!wx.cloud || !app.globalData.cloudReady) {
      this.setData({ error: app.globalData.cloudError || '云开发暂不可用，请检查微信开发者工具的云开发配置。' });
      return;
    }

    this.setData({ loading: true, error: '' });

    try {
      const response = await wx.cloud.callFunction({
        name: 'analyzeBazi',
        data: input
      });
      const result = (response && response.result) ? response.result : null;

      if (!result || !result.ok) {
        this.setData({ loading: false, error: this.getErrorMessage(result) });
        return;
      }

      app.globalData.latestBaziResult = result;
      wx.navigateTo({ url: '/pages/result/result' });

    } catch (err) {
      console.error('analyzeBazi call error:', err);
      this.setData({ loading: false, error: '云函数调用失败，请检查网络后重试。' });
    } finally {
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
  },

  getErrorMessage(result) {
    if (!result) return '云函数没有返回内容，请确认 analyzeBazi 已部署。';
    if (result.message) return result.message;
    if (result.report && result.report.summary) return result.report.summary;
    if (result.error === 'MISSING_ENV')        return '云函数环境变量未配置，请到云开发控制台添加 LLM_API_KEY 等变量。';
    if (result.error === 'INVALID_INPUT')       return '信息不完整，请检查必填项。';
    if (result.error === 'LLM_REQUEST_FAILED')  return '模型服务暂时不可用，请稍后再试。';
    if (result.error === 'INVALID_LLM_RESPONSE') return '模型返回内容暂时无法展示，请稍后再试。';
    if (result.error === 'FUNCTION_EXCEPTION')   return '云函数执行异常，请稍后重试。';
    return '生成结果暂时不可用，请稍后重试。';
  }
});
