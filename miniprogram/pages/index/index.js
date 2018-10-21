//index.js
const app = getApp()

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    typeArr: [6.00],
    list: [1.2, 1.3, 1.4, 1.5],
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
    }),

    this.productionApply();
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

  function productionApply() {
    // 原材料总长度
    let totalLength = sumLength(list);
    console.log(1111, totalLength);
    
    // // 各规格的根数
    // let x = 0;
    // let y = 0;
    // let z = 0;
    // const typeNumber = [x, y, z];
    // if (typeArr.length === 1) {
    //   y = 0;
    //   z = 0;
    // } else if (typeArr.length === 2) {
    //   z = 0;
    // }

    // 先给料排个序，先下长的
    const _list = list.sort((a, b) => a - b <0).concat([]);
    // 规格只有1种
    // const typeArr = this.data.typeArr;
    if (totalLength > 0) {
      // 材料的最大根数
      const maxNumber = Math.ceil(totalLength / typeArr[0]);
      
      // 每一种下料的可能
      let sample = [];
      let totalSamples = [];

      // 只需要一根材料
      if (maxNumber === 1) {
        sample = [list];
        totalSamples = [sample];
        return totalSamples;
      } else {
        // 不止一根，先将最长的放第一根料上
        // 再从大到小分配其他下料
        _list.shift();
        const _array = _list;
        let group = getGroup(_array);
        for (let i = 0; i < group.length; i++) {
          totalSamples.push([group[i].concat(list[0]), getResetArray(_array, group[i])]);
        }
        console.log(totalSamples);
      }
      

    }
  }

  function sumLength(arr) {
    if(Array.isArray(arr)) {
      let totalLength = 0;
      arr.forEach((item) => totalLength+= item);
      return totalLength;
    }
    return;
  }

  function getGroup(data, index = 0, group = []) {
    if (index === 0) {
      group.push([]);
    }
    const need_apply = new Array();
    for (let i = 0; i < group.length; i++) {
      need_apply.push(group[i].concat([data[index]]));
    }
    group = group.concat(need_apply);
    if (index === data.length -1) {
      return group;
    }
    return getGroup(data, index + 1, group);
  }

  function getResetArray(oriArray, targetArray) {
    const result = [...oriArray];
    for (let i = 0; i < targetArray.length; i++) {
      result.splice(result.findIndex((item) => item === targetArray[i]), 1);
    }
    return result;
  }


})
