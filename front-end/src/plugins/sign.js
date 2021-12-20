/*
 * @Description:签名页面主要逻辑代码
 * @Author: xuxin
 * @Date: 2021-12-10 17:40:19
 * @LastEditTime: 2021-12-15 18:00:32
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/js/sign.js
 * @Reference:
 */
/* global $, document, Image */
/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true , "allowTernary": true }] */
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["getRotatedCanvas"] }] */
import { addToStorage, getFromStorage, pushToStorage } from '../utils/localStorage';

let scaleLock = false;
let emptyLock = true;

function handleTouchstart(e) {
  const { ctx } = this;
  !scaleLock && ctx.scale(this.scaleRatio, this.scaleRatio) && (scaleLock = true);
  emptyLock && this.clearCanvas();
  emptyLock = false;
  const { clientX, clientY } = e.originalEvent.touches[0];
  ctx.beginPath();
  ctx.moveTo(clientX - this.space.left, clientY - this.space.top);
}

function handleTouchmove(e) {
  const { ctx } = this;
  const { clientX, clientY } = e.originalEvent.touches[0];
  ctx.lineTo(clientX - this.space.left, clientY - this.space.top);
  ctx.stroke();
  this.signLock = false;
}
function handleTouchend() {
  const { ctx } = this;
  scaleLock = false;
  ctx.scale(1 / this.scaleRatio, 1 / this.scaleRatio);
}

export default class Sign {
  constructor(opt) {
    this.canvas = $('#canvas');
    this.scaleRatio = 4;
    this.canvas[0].width = (this.canvas.parent().width()) * this.scaleRatio;
    this.canvas[0].height = (this.canvas.parent().height()) * this.scaleRatio;
    this.space = {
      left: opt.space ? opt.space.left : 0,
      top: opt.space ? opt.space.top : 0,
    };
    this.color = opt.line ? opt.line.color : '#000';
    // 粗：2 中：1 细：。5
    this.lineWidth = opt.line ? opt.line.width : 1;
    this.init();
  }

  init() {
    this.initCanvas();
    this.bindEvent();
  }

  bindEvent() {
    this.canvas.on('touchstart', handleTouchstart.bind(this))
      .on('touchmove', handleTouchmove.bind(this))
      .on('touchend', handleTouchend.bind(this));
  }

  // 初始化canvas
  initCanvas() {
    const canvasDom = this.canvas[0];
    // 初始化画笔
    this.ctx = canvasDom.getContext('2d');
    // 设置画笔属性
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.shadowBlur = 1;
    this.ctx.shadowColor = this.color;
    this.ctx.beginPath();
    this.drawBaseText();
  }

  // 更改笔的颜色
  changePenColor(color) {
    this.color = color;
    this.ctx.strokeStyle = color;
    this.ctx.shadowColor = color;
  }

  // 更改笔的粗细
  changePenWidth(width) {
    // eslint-disable-next-line
    width = Number(width);
    this.lineWidth = width;
    this.ctx.lineWidth = width || 1;
  }

  // 绘制提示
  drawBaseText() {
    const { ctx } = this;
    const canvasDom = this.canvas[0];
    ctx.rotate(Math.PI / 2);
    ctx.lineWidth = 1;
    ctx.font = "120px '微软雅黑'";
    ctx.fillStyle = '#ddd';
    ctx.strokeStyle = '#ddd';
    ctx.shadowColor = '#ddd';
    ctx.strokeText('签字区', canvasDom.height / 2 - 200, -canvasDom.width / 2 + 50);
    ctx.fillText('签字区', canvasDom.height / 2 - 200, -canvasDom.width / 2 + 50);
    ctx.restore();
    ctx.rotate(-Math.PI / 2);
    this.ctx.strokeStyle = this.color;
    this.ctx.shadowColor = this.color;
    this.ctx.lineWidth = this.lineWidth;
    emptyLock = true;
  }

  // 清空签名板
  clearCanvas() {
    const canvasDom = this.canvas[0];
    this.ctx.clearRect(0, 0, canvasDom.width, canvasDom.height);
  }

  // 重签
  rewrite() {
    this.clearCanvas();
    this.drawBaseText();
    emptyLock = true;
  }

  // 保存
  async save() {
    const base64pic = await this.getSignPic_base64();
    const arr = getFromStorage('signArr');
    const obj = {
      id: (`${Math.random()}`).slice(2, 5) + (`${Date.now()}`).slice(-5, -1),
      img: base64pic,
    };
    arr ? pushToStorage('signArr', obj) : addToStorage('signArr', [obj]);
    this.clearCanvas();
    this.drawBaseText();
    emptyLock = true;
  }

  // 获取未处理的图片(旋转前)
  getUnhandlePic() {
    return this.canvas[0].toDataURL();
  }

  // 获取旋转后的canvas
  getRotatedCanvas(dataURl) {
    return new Promise((resolve) => {
      const imgView = new Image();
      imgView.src = dataURl;
      imgView.onload = () => {
        const canvasForRotate = document.createElement('canvas');
        canvasForRotate.width = imgView.height;
        canvasForRotate.height = imgView.width;
        const ctxForRotatedCanvas = canvasForRotate.getContext('2d');
        ctxForRotatedCanvas.translate(0, imgView.width);
        ctxForRotatedCanvas.rotate(-Math.PI / 2);
        ctxForRotatedCanvas.drawImage(imgView, 0, 0);
        resolve(canvasForRotate);
        //   canvasForRotate.toBlob((blob) => {
        // file = new File([blob], 'sign.png', { type: 'image/png' }); // 签名的图片文件
        // });
      };
    });
  }

  // 获取旋转后的签名图片(base64) => 存储
  async getSignPic_base64() {
    const canvasRes = await this.getRotatedCanvas(this.getUnhandlePic());
    return canvasRes.toDataURL();
  }

  // async getSignPic_file() {
  //   const canvasRes = await this.getRotatedCanvas();
  //   return new Promise((resolve) => {
  //     canvasRes.toBlob((blob) => {
  //       // eslint-disable-next-line
  //       const file = new File([blob], 'sign.png', { type: 'image/png' }); // 签名的图片文件
  //       resolve(file);
  //     });
  //   });
  // }
}
