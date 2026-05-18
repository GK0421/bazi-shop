// 首页逻辑
Page({
  data: {
    birthday: '',
    hours: ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'],
    hourIndex: 11,  // 默认未时（index 7=未时，这里默认12时→index 11）
    gender: '男',
    location: ''
  },

  onBirthdayChange(e) {
    this.setData({ birthday: e.detail.value });
  },

  onHourChange(e) {
    const hourMap = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
    this.setData({
      hourIndex: parseInt(e.detail.value),
      hour: hourMap[parseInt(e.detail.value)]
    });
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
