Page({
  data: {
    birthday: "",
    hours: ["子时", "丑时", "寅时", "卯时", "辰时", "巳时", "午时", "未时", "申时", "酉时", "戌时", "亥时"],
    hourIndex: 11,
    hour: 21,
    gender: "男",
    location: ""
  },

  onBirthdayChange(event) {
    this.setData({ birthday: event.detail.value });
  },

  onHourChange(event) {
    const nextIndex = Number(event.detail.value);
    const hourMap = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

    this.setData({
      hourIndex: nextIndex,
      hour: hourMap[nextIndex]
    });
  },

  onGenderChange(event) {
    this.setData({ gender: event.detail.value });
  },

  onLocationInput(event) {
    this.setData({ location: event.detail.value });
  },

  submit() {
    const { birthday, hour, gender, location } = this.data;

    if (!birthday) {
      tt.showToast({ title: "请选择生日", icon: "none" });
      return;
    }

    tt.showLoading({ title: "分析中..." });

    const app = getApp();
    tt.request({
      url: `${app.globalData.backendBaseUrl}/api/analyze-bazi`,
      method: "POST",
      header: {
        "content-type": "application/json"
      },
      data: { birthday, hour, gender, location },
      success: (response) => {
        tt.hideLoading();

        const payload = response.data || {};
        if (response.statusCode === 200 && payload.success) {
          tt.navigateTo({
            url: `/pages/result/result?result=${encodeURIComponent(payload.result)}`
          });
          return;
        }

        tt.showToast({
          title: payload.error || "分析失败，请稍后重试",
          icon: "none"
        });
      },
      fail: () => {
        tt.hideLoading();
        tt.showToast({
          title: "后端未启动，请先运行本地 API",
          icon: "none"
        });
      }
    });
  }
});
