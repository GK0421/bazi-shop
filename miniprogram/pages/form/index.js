const hourMap = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

Page({
  data: {
    birthday: '',
    hours: ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'],
    hourIndex: 0,
    gender: '男',
    location: '',
    remark: ''
  },

  onBirthdayChange(e) {
    this.setData({ birthday: e.detail.value });
  },

  onHourChange(e) {
    const idx = parseInt(e.detail.value, 10);
    this.setData({ hourIndex: idx, hour: hourMap[idx] });
  },

  onGenderChange(e) {
    this.setData({ gender: e.detail.value });
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  goBack() {
    wx.navigateBack();
  },

  submit() {
    const { birthday, hour, gender, location } = this.data;
    if (!birthday) {
      wx.showToast({ title: '请选择生日', icon: 'none' });
      return;
    }
    if (!hour) {
      wx.showToast({ title: '请选择时辰', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '分析中...' });
    wx.cloud.callFunction({
      name: 'analyzeBazi',
      data: { birthday, hour, gender, location }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.ok) {
        wx.navigateTo({
          url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify(res.result))}`
        });
      } else {
        const msg = res.result && res.result.report ? res.result.report.title : '分析失败';
        wx.showToast({ title: msg, icon: 'none', duration: 3000 });
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
    });
  }
});
