Page({
  data: {
    result: ''
  },
  onLoad(options) {
    if (options.result) {
      this.setData({ result: decodeURIComponent(options.result) });
    }
  }
});
