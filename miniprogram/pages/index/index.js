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
    list: [1.2, 1.3, 1.4, 1.5, 1.2, 1.3, 1.4, 1.5],
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

  productionApply() {
    // 原材料总长度
    let totalLength = this.sumLength(this.data.list);
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

    const typeArr = this.data.typeArr;
    // 先给料排个序，先下长的
    const _list = this.data.list.sort((a, b) => a - b <0).concat([]);
    // 规格只有1种
    if (totalLength > 0) {
      // 材料的最大根数，简略计算，实际下面最大根数除1以外，均需在maxNumber上+1简算
      const maxNumber = Math.ceil(totalLength / typeArr[0]);
      
      // 每一种下料的可能
      let sample = [];
      let totalSamples = [];

      // 只需要一根材料
      if (maxNumber === 1) {
        sample = [this.data.list];
        totalSamples = [sample];
        return totalSamples;
      } else {
        // _list.shift();
        const _array = _list;
        let group = this.getGroup(_array);
        // 从这个group中任选maxNumber个数组，再找出其中涵盖所有list，并且长度符合要求的解
        // 如上面找不到解，需要任选maxNumber+1个数组，重复求解
        totalSamples = this.getSamplesFromGroup(group, 0, [], maxNumber, maxNumber);
        console.log(totalSamples);
        for (let j = 0; j < totalSamples.length; j++) {
          if (totalSamples[j])
        }

        // for (let i = 0; i < group.length; i++) {
        //   totalSamples.push([group[i].concat(this.data.list[0]), this.getResetArray(_array, group[i])]);
        // }
        // console.log(totalSamples);
      }

      // 去除totalSamples中某一根超过规格长度的
      for (let j = 0; j < totalSamples.length; j ++) {
        for (let k = 0; k < totalSamples[j].length; k++) {
          if (this.sumLength(totalSamples[j][k]) > typeArr[0]) {
            totalSamples.splice(j, 1);
          }
        }
      }
      console.log(totalSamples);

      // 每一种下料的材料利用率

      

    }
  },

  sumLength(arr) {
    if(Array.isArray(arr)) {
      let totalLength = 0;
      arr.forEach((item) => totalLength+= item);
      return totalLength;
    }
    return;
  },

  // 获取数组的全排列组合
  getGroup(data, index = 0, group = []) {
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
    return this.getGroup(data, index + 1, group);
  },

  // 得到剩余数组
  getResetArray(oriArray, targetArray) {
    const result = [...oriArray];
    for (let i = 0; i < targetArray.length; i++) {
      result.splice(result.findIndex((item) => item === targetArray[i]), 1);
    }
    return result;
  },

  // // 从数组中任选不同的n项进行组合
  // getSamplesFromGroup(group, n = 2, start = 0, result = []) {
  //   for (let i = start; i < group.length; i++) {

  //   }
  // },

  // 从数组中任选不同的n项进行组合
  /*
    @param arr 原始大数组
    @param start 起始点，从什么位置开始取，默认为0
    @param result 遍历存储最终结果的地方
    @param cuont 遍历辅助索引值
    @param NUM 取数的数量，默认为1
  */
  getSamplesFromGroup(arr, start = 0, result = [], count, NUM = 1) {
    for (let i = start; i < arr.length + 1 - count; i++) {
      result[count - 1] = i;
      if (count - 1 == 0) {
        const item = [];
        for (let j = NUM - 1; j >= 0; j--) {
          item.push(arr[result[j]]);
        }
        console.log(item);
        result.push(item);
      } else {
        this.getSamplesFromGroup(arr, i + 1, result, count - 1, NUM);
      }
    }
    const _result = [];
    for (let k = 0; k < result.length; k++) {
      if (Array.isArray(result[k]) && result[k].length === NUM) {
        _result.push(result[k]);
      }
    }
    return _result;
  },
})
