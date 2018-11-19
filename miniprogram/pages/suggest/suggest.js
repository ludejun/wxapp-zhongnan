// pages/suggest/suggest.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    background: ['/images/bg1.png', '/images/bg2.jpg', '/images/bg3.jpg'],
    code: '请扫描商家出示的二维码得到'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (Number(options.scan) === 1) {
      let code = this.generateCode() + '8' + this.generateCode();
      this.setData({
        code: code
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (options) {
    return {
      title: '中南门窗品质保证|推荐返3%🎉🎉🎉',
      path: '/pages/suggest/suggest',
    };
  },

  generateCode: function () {
    let code = parseInt(Math.random() * 100);
    if (code < 10) {
      return '0' + code;
    }
    return code;
  }
})