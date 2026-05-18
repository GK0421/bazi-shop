// 首页逻辑
Page({
  data: {
    birthday: '',
    hour: 12,
    gender: '男',
    location: ''
  },

  onBirthdayChange(e) {
    this.setData({ birthday: e.detail.value });
  },

  onHourChange(e) {
    this.setData({ hour: parseInt(e.detail.value) });
  },

  onGenderChange(e) {
    this.setData({ gender: e.detail.value });
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value });
  },

  submit() {
    const { birthday, hour, gender, location } = this.data;
    if (!birthday) {
      wx.showToast({ title: '请选择生日', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '分析中...' });
    wx.cloud.callFunction({
      name: 'analyzeBazi',
      data: { birthday, hour, gender, location }
    }).then(res => {
      wx.hideLoading();
      if (res.result.success) {
        wx.navigateTo({
          url: `/pages/result/result?result=${encodeURIComponent(res.result.result)}`
        });
      } else {
        wx.showToast({ title: res.result.error, icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '网络错误', icon: 'none' });
    });
  }
});
