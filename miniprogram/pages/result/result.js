const DEFAULT_DISCLAIMER = '本内容仅供传统干支文化学习与娱乐参考，不构成医疗、投资、婚姻、职业或其他现实决策依据。';

Page({
  data: {
    hasResult: false,
    input: {},
    report: {
      title: '暂未生成结果',
      summary: '没有收到可展示的内容，请返回首页重新体验。',
      baziCultureNote: '',
      fiveElementsNote: '',
      disclaimer: DEFAULT_DISCLAIMER
    }
  },

  onLoad(query) {
    if (!query || !query.payload) return;

    try {
      const result = JSON.parse(decodeURIComponent(query.payload));
      if (!result || !result.report) return;

      this.setData({
        hasResult: true,
        input: result.input || {},
        report: {
          title: result.report.title || '传统干支文化学习说明',
          summary: result.report.summary || '暂时没有可展示的说明。',
          baziCultureNote: result.report.baziCultureNote || '干支文化常用天干、地支与节气来记录时间，也常被用作民俗文化学习材料。',
          fiveElementsNote: result.report.fiveElementsNote || '五行是传统文化中的分类方式，适合作为文化概念了解。',
          disclaimer: result.report.disclaimer || DEFAULT_DISCLAIMER
        }
      });
    } catch (error) {
      this.setData({
        hasResult: false
      });
    }
  },

  goHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
