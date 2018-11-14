//index.js
const app = getApp()

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '',
    typeArr: [650, 600, 540],
    list: [{'value': null, 'num': 2}],
    finalSample: null,
    finalType: null,
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

  onTypeDeleteClick (e) {
    console.log(e.target.dataset.no);
    const typeArr = this.data.typeArr;
    typeArr.splice(e.target.dataset.no, 1);
    this.setData({
      typeArr: typeArr
    });
  },
  onSampleDeleteClick (e) {
    console.log(e.target.dataset.no);
    const list = this.data.list;
    list.splice(e.target.dataset.no, 1);
    this.setData({
      list: list
    });
  },
  onSampleAddClick (e) {
    const list = this.data.list.concat([{ 'value': null, 'num': 2 }]);
    this.setData({
      list: list
    });
  },

  onSampleInput (e) {
    console.log(e.detail.value, e.target.dataset.no);
    this.data.list[e.target.dataset.no].value = parseInt(e.detail.value);
    const list = this.data.list.concat([]);
    list[e.target.dataset.no].value = parseInt(e.detail.value);
    this.setData({
      list: list
    });
  },
  onSampleNumInput (e) {
    console.log(e.detail.value, e.target.dataset.no);
    this.data.list[e.target.dataset.no].num = parseInt(e.detail.value);
    const list = this.data.list.concat([]);
    list[e.target.dataset.no].num = parseInt(e.detail.value);
    this.setData({
      list: list
    });
  },

  productionApply() {
    // 延展原材料成一维数字数组
    const list = [];
    for (let i = 0; i < this.data.list.length; i++) {
      if (this.data.list[i].value && this.data.list[i].num) {
        list.push(...new Array(this.data.list[i].num).fill(this.data.list[i].value));
      }
    }
    // 原材料总长度
    let totalLength = this.sumLength(list);
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
    const _list = list.sort((a, b) => a - b <0).concat([]);
    // 将规格从小到大排序
    typeArr.sort((a, b) => a - b);
    
    if (totalLength > 0) {
      // 材料的最大根数，简略计算，实际下面最大根数除1以外，均需在maxNumber上+1简算
      const minNumber = Math.ceil(totalLength / typeArr[typeArr.length - 1]);
      const maxNumber = Math.ceil(totalLength / typeArr[0]);
      
      // 每一种下料的可能
      let sample = [];
      let totalSamples = [];

      // 看是否只需要一根材料
      if (this.sumLength(list) < typeArr[typeArr.length - 1]) {
        sample = [list];
        totalSamples = [sample];
        return totalSamples;
      } else {
        // _list.shift();
        const _array = _list;
        const group = this.getGroup(_array);
        console.log(5555, group);

        // 从group中剔除某一项长度超规格的
        const _group = [];
        group.forEach((item) => {
          if (this.sumLength(item) <= typeArr[typeArr.length - 1]) {
            _group.push(item);
          }
        });
        console.log(2222, _group);
        // 从这个group中任选maxNumber个数组，再找出其中涵盖所有list，并且长度符合要求的解
        // maxNumber项合起来应与全部下料相同
        // 如上面找不到解，需要任选maxNumber+1个数组，重复求解
        for (let n = minNumber; n <= maxNumber+1; n++) {
          totalSamples = this.getTotalSample(_group, n, _list);
          if (totalSamples.length === 0) {
            continue;
          } else {
            break;
          }
        }
        // totalSamples = this.getTotalSample(_group, maxNumber, _list);
        // // 任选maxNumber个无解，需要maxNumber+1根材料
        // if (totalSamples.length === 0) {
        //   totalSamples = this.getTotalSample(_group, maxNumber + 1, _list);
        //   console.log(7777, totalSamples)
        // }
      }

      // 每一种下料的材料利用率
      const rate = [];
      for (let i = 0; i < totalSamples.length; i++) {
        rate[i] = [];
        for (let j =0; j < totalSamples[i].length; j++) {
          rate[i].push(this.sumLength(totalSamples[i][j])/this.getSampleType(totalSamples[i][j], typeArr));
        }
        rate[i].sort((a, b) => b - a);
        // 将前length-1个使用率加和，放入最后一个位置；将原位置标示放到倒数第二个位置，便于查找下料方法
        rate[i].push(i, this.sumLength(rate[i]) - rate[i][rate[i].length -1]);
      }
      console.log(88888, rate);
      // 找出里面前length-1个使用率最高的，最后一根剩余材料可以作为库存
      rate.sort((a, b) =>  b[b.length-1] - a[a.length-1]);
      console.log(99999, rate);
      // 则rate[0]的倒数第二个标示位即为totalSamples中最佳下料方法
      console.log(0, totalSamples[rate[0][rate[0].length - 2]]);
      // return totalSamples[rate[0][rate[0].length - 2]];
      
      this.setData({
        finalSample: totalSamples[rate[0][rate[0].length - 2]],
        finalType: totalSamples[rate[0][rate[0].length - 2]].map((item) => this.getSampleType(item, typeArr)),
        finalSummary: this.data.finalType.
      });
      console.log(this.data.finalSample, this.data.finalType);
    }
  },

  // 获取任选n个解法数量
  getTotalSample (group, number, list) {
    const totalSamples = this.getSamplesFromGroup(group, 0, [], number, number);
    console.log(3333, totalSamples);
    const _totalSample = [];
    for (let j = 0; j < totalSamples.length; j++) {
      let tempArr = [];
      totalSamples[j].forEach((item, index) => {
        tempArr = tempArr.concat(item);
        index === (number - 1) && tempArr.sort((a, b) => a - b <0);
      });
      list.length === tempArr.length && JSON.stringify(list) === JSON.stringify(tempArr) && _totalSample.push(totalSamples[j]);
    }
    console.log(66666, _totalSample);
    return _totalSample;
  },

  // 某一种下料方式对应规格材料及材料使用率
  // typeArr默认需从小到大排列
  getSampleType(sampleArr, typeArr) {
    const len = this.sumLength(sampleArr);

    if (len <= typeArr[0] || typeArr.length === 1) {
      return typeArr[0];
    }
    for (let i = 0; i < typeArr.length -1; i++) {
      if (len > typeArr[i] && len <= typeArr[i+1]){
        return typeArr[i+1];
      }
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
    if (index === data.length - 1) {
      group.shift(0, 1);
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

  // // 从数组中任选不同的n项进行组合，并对输出做限制
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
        // console.log(item);
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
    result = null;
    return _result;
  },
})
