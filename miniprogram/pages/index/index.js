Page({
  data: {},

  onLoad() {
    // Ensure cloud is ready
    const app = getApp();
    if (!app.globalData.cloudReady) {
      wx.showToast({ title: '云开发初始化中...', icon: 'none', duration: 2000 });
    }
  },

  goForm() {
    wx.navigateTo({
      url: '/pages/form/form'
    });
  },

  goAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  }
});
