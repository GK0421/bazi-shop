Page({
  data: {
    report: null,
    input: null
  },
  onLoad(options) {
    if (options.data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(options.data));
        this.setData({
          report: parsed.report || null,
          input: parsed.input || null
        });
      } catch (e) {
        console.error('Failed to parse result data', e);
      }
    }
  },
  goHome() {
    wx.redirectTo({ url: '/pages/index/index' });
  }
});
