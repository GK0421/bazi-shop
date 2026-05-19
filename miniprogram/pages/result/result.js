const DEFAULT_DISCLAIMER = '本内容仅供传统干支文化学习与娱乐参考，不构成医疗、投资、婚姻、职业或其他现实决策依据。';
const AUDIO_ERROR_MESSAGE = '语音摘要生成失败，请稍后重试';
const app = getApp();

Page({
  data: {
    hasResult: false,
    input: {},
    report: {
      title: '暂未生成结果',
      summary: '没有收到可展示的内容，请返回首页重新体验。',
      baziCultureNote: '',
      fiveElementsNote: '',
      disclaimer: DEFAULT_DISCLAIMER
    },
    audioLoading: false,
    audioPlaying: false,
    audioError: ''
  },

  audioContext: null,

  onLoad(query) {
    const result = this.readResult(query);

    if (!result || !result.report) return;

    this.setData({
      hasResult: true,
      input: result.input || {},
      report: {
        title: result.report.title || '传统干支文化学习说明',
        summary: result.report.summary || '暂时没有可展示的说明。',
        baziCultureNote: result.report.baziCultureNote || '干支文化常用天干、地支与节气来记录时间，也常作为民俗文化学习材料。',
        fiveElementsNote: result.report.fiveElementsNote || '五行是传统文化中的分类方式，适合作为文化概念了解。',
        disclaimer: result.report.disclaimer || DEFAULT_DISCLAIMER
      }
    });
  },

  readResult(query) {
    if (query && query.payload) {
      try {
        return JSON.parse(decodeURIComponent(query.payload));
      } catch (error) {
        return this.readSavedResult();
      }
    }

    return this.readSavedResult();
  },

  readSavedResult() {
    return app.globalData.latestBaziResult || null;
  },

  async playAudioSummary() {
    if (!this.data.hasResult || this.data.audioLoading) return;

    if (!wx.cloud || !app.globalData.cloudReady) {
      this.setData({ audioError: AUDIO_ERROR_MESSAGE });
      return;
    }

    this.setData({ audioLoading: true, audioError: '' });

    try {
      const response = await wx.cloud.callFunction({
        name: 'generateAudio',
        data: {
          report: {
            summary: this.data.report.summary,
            baziCultureNote: this.data.report.baziCultureNote,
            fiveElementsNote: this.data.report.fiveElementsNote
          }
        }
      });
      const result = response && response.result ? response.result : null;

      if (!result || !result.ok || !result.audioBase64) {
        this.setData({ audioError: AUDIO_ERROR_MESSAGE });
        return;
      }

      const filePath = `${wx.env.USER_DATA_PATH}/bazi-audio-summary-${Date.now()}.mp3`;
      await this.writeAudioFile(filePath, result.audioBase64);
      this.playAudioFile(filePath);
    } catch (error) {
      this.setData({ audioError: AUDIO_ERROR_MESSAGE });
    } finally {
      this.setData({ audioLoading: false });
    }
  },

  writeAudioFile(filePath, audioBase64) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().writeFile({
        filePath,
        data: audioBase64,
        encoding: 'base64',
        success: resolve,
        fail: reject
      });
    });
  },

  playAudioFile(filePath) {
    if (this.audioContext) {
      this.audioContext.destroy();
    }

    const audioContext = wx.createInnerAudioContext();
    this.audioContext = audioContext;
    audioContext.src = filePath;
    audioContext.onPlay(() => {
      this.setData({ audioPlaying: true, audioError: '' });
    });
    audioContext.onEnded(() => {
      this.setData({ audioPlaying: false });
    });
    audioContext.onStop(() => {
      this.setData({ audioPlaying: false });
    });
    audioContext.onError(() => {
      this.setData({
        audioPlaying: false,
        audioError: AUDIO_ERROR_MESSAGE
      });
    });
    audioContext.play();
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },

  goHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
