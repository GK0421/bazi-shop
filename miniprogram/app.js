// 小程序全局逻辑
App({
  globalData: {
    cloudEnv: 'cloud1-d1gwyutj2d122bc22'
  },
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-d1gwyutj2d122bc22',
        traceUser: true,
      });
    }
  }
});
