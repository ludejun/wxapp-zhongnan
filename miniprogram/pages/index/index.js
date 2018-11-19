//index.js
const app = getApp()

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    shops: [{
      "des": '断桥铝',
      "img": '/images/shops/dq.jpeg',
    }, {
        "des": '塑钢门窗',
        "img": '/images/shops/sg.jpeg',
      }, {
        "des": '铝合金门窗',
        "img": '/images/shops/lhj.jpg',
      },
      {
        "des": '隔断',
        "img": '/images/shops/gd.jpg',
      }, {
        "des": '阳光房',
        "img": '/images/shops/yg.jpeg',
      }, {
        "des": '高级纱窗',
        "img": '/images/shops/sc.jpg',
      }
    ],
    markers: [{
      id: 0,
      longitude: 113.1354475021,
      latitude: 36.1785748275,
      iconPath: "",
      title: '长治市新民装饰城东区6排11号',
      label: {
        content: '中南门窗\n长治市新民装饰城东区6排11号',
        color: '#FB4E44',
        // borderWidth: 1,
        // borderColor: '#FB4E44',
        // borderWidth: 5
      }
    }],
    itemList: [{
      img: '/images/shops/dq.jpeg',
      title: '高档断桥铝门窗，断冷热，颜色多选',
      brand: '中铝/坚美/凤铝/经阁/伟业/兴发/中德等',
      color: '灰色/咖啡色/绿色/梅红色/蓝色等',
      glass: '单玻/双层/真空/浮化/磨砂/艺术',
      type: '推拉/平开/内倒/下悬/复合',
      price: 270
    }, {
        img: '/images/shops/sg.jpeg',
        title: 'PVC塑钢门窗，普遍优惠，+内嵌钢材',
        brand: '中德/惠丰等',
        color: '白色等',
        glass: '单玻/双层/真空/浮化/磨砂/艺术',
        type: '推拉/平开',
        price: 120
    }, {
        img: '/images/shops/lhj.jpg',
        title: '铝合金门窗，美观强度高',
        brand: '中铝/坚美/凤铝等',
        color: '咖啡色/绿色等',
        glass: '单玻/双层/真空/浮化/磨砂/艺术',
        type: '推拉/平开',
        price: 140
    }]
  },

  onLoad: function() {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    });
  },

  onGetUserInfo: function(e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },

  onPhoneClick: function (e) {
    console.log(e.target.dataset.phone);
    let phone = e.target.dataset.phone || "13015462480";
    wx.makePhoneCall({
      phoneNumber: phone
    });
  },

  onShareAppMessage: function (options) {
    return {
      title: '中南门窗品质保证|推荐返3%🎉🎉🎉',
      path: '/pages/index/index',
    };
  }
})
