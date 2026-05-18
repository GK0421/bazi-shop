Page({
  goHome() {
    wx.redirectTo({ url: '/pages/index/index' });
  },
  openGithub() {
    wx.setClipboardData({
      data: 'https://github.com/GK0421/bazi-shop',
      success() {
        wx.showToast({ title: '链接已复制', icon: 'none' });
      }
    });
  }
});
