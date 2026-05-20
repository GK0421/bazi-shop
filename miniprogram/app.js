App({
  globalData: {
    cloudReady: false,
    cloudError: '',
    latestBaziResult: null
  },

  onLaunch() {
    if (!wx.cloud) {
      this.globalData.cloudError = '当前基础库暂不支持云开发，请升级微信开发者工具或基础库。';
      return;
    }

    try {
      wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV
      });
      this.globalData.cloudReady = true;
    } catch (error) {
      this.globalData.cloudError = '云开发初始化未完成，请检查开发者工具配置。';
    }
  }
});
