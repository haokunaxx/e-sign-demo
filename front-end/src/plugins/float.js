/* global $, document */
/* eslint no-use-before-define: ["error", { "classes": false }] */
/* eslint class-methods-use-this: ["error", {"exceptMethods":[ "signDeleteHandler" ]} ] */
/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true , "allowTernary": true }] */
let beginX = 0;
let beginY = 0;

let offsetX = 0;
let offsetY = 0;

// 是否初始化标识（计算相关尺寸）
const hasCalculateDisplaySize = false;

// 单页pdf原始的尺寸
const pageOriginalSize = {
  width: 0,
  height: 0,
};
// 单页pdf图片实际显示的尺寸
const pageDisplaySize = {
  height: 0,
  width: 0,
};
let pageWrapDisplaySize = 0; // 单页pdf图片外层容器实际显示的尺寸，实测比pdf图片大，如果直接使用pdf图片的实际显示尺寸会有偏差，所以特地拿出来
let pdfBetweenSpace = 0; // pdf页面之间的间隔 margin-bottom

let ratio = 0; // 缩放比例

let beginXP = 0; // 缩放指针的开始位置
let beginYP = 0;

let wrapSpaceLeft = 0; // pdf容器左侧偏移值：margin-left + padding-left
let wrapSpaceTop = 0; // pdf容器上侧偏移值：margin-top + margin-top

// 获取偏移值
function getOffsetValue(elem) {
//   let { offsetTop } = elem;
//   let { offsetLeft } = elem;
//   let { offsetParent } = elem;
  const marginTop = parseInt($(elem).css('margin-top'), 10);
  const paddingTop = parseInt($(elem).css('padding-top'), 10);
  const marginLeft = parseInt($(elem).css('margin-left'), 10);
  const paddingLeft = parseInt($(elem).css('padding-left'), 10);
  //   while (offsetParent) {
  //     offsetTop += offsetParent.offsetTop;
  //     offsetLeft += offsetParent.offsetLeft;
  //     offsetParent = offsetParent.offsetParent;
  //   }
  return {
    top: marginTop + paddingTop,
    left: marginLeft + paddingLeft,
  };
}

// 计算pdf缩放比例
function calculateRatio() {
  ratio = pageDisplaySize.width / pageOriginalSize.width;
}
// 计算相关尺寸
function calculateDisplaySize() {
  return new Promise((resolve) => {
    const viewOffset = getOffsetValue($('.pdfViewer')[0]);
    const page1 = $('.canvasImg1');
    const img = document.createElement('img');
    wrapSpaceLeft = viewOffset.left;
    wrapSpaceTop = viewOffset.top;

    pageDisplaySize.width = page1[0].width;
    pageDisplaySize.height = page1[0].height;

    pageWrapDisplaySize = page1.parent().height();
    pdfBetweenSpace = parseInt(page1.parent().css('margin-bottom'), 10);

    img.onload = () => {
      pageOriginalSize.width = img.width;
      pageOriginalSize.height = img.height;
      calculateRatio();
      resolve();
    };
    img.src = page1.attr('src');
  });
}

// 计算当前签名在提交时的位置
function calculatePosition() {
  const tar = this.target[0];

  const offsetXTemp = tar.offsetLeft;// box距离左侧的偏移
  const offsetYTemp = tar.offsetTop;// box距离上面的偏移
  console.log(tar, offsetXTemp, offsetYTemp);
  const { height: pageDisplaySizeHeight } = pageDisplaySize; // 获取单张pdf显示的高度

  // 当前签名所在的pdf的页数
  this.page = Math.floor(offsetYTemp / pageDisplaySizeHeight);
  // 当前签名左上角在当前pdf页的y轴偏移值 = 签名左上角偏移值 - 外层容器的padding-top - 上一页的高度 - 页面之间的间隔
  //   eslint-disable-next-line
  const pageInnerOffsetY = offsetYTemp - wrapSpaceTop - this.page * pageWrapDisplaySize - this.page * pdfBetweenSpace;
  // x轴偏移值 / ratio = x
  const x = offsetXTemp / ratio - wrapSpaceLeft / ratio;
  /*
    由于合成需要的是 距离pdf左下角的位置
    合成时图片左下角距离pdf左下角的距离 = 显示的图片左下角距离pdf左下角的距离 / 缩放比例
                                = （显示pdf的高度 - 显示的图片左上角在当前pdf页面的偏移 + 显示的图片的高度） / 缩放比例
    */
  const y = (pageDisplaySizeHeight - pageInnerOffsetY - this.dispHeight) / ratio;
  return {
    x, y,
  };
}

// 移动相关
function handleTouchstart(e) {
  e.stopPropagation();
  e.preventDefault();
  const tar = $(e.target).parent()[0];
  const touch = e.originalEvent.touches[0];
  offsetX = tar.offsetLeft;
  offsetY = tar.offsetTop;
  beginX = touch.clientX;
  beginY = touch.clientY;
}
function handleTouchmove(e) {
  e.stopPropagation();
  e.preventDefault();
  const tar = this.target;
  const { clientX, clientY } = e.originalEvent.touches[0];
  const moveX = clientX - beginX;
  const moveY = clientY - beginY;
  tar.css('left', `${offsetX + moveX}px`).css('top', `${offsetY + moveY}px`);
}
function handleTouchend(e) {
  e.stopPropagation();
  e.preventDefault();

  // 重置初始值
  beginX = 0;
  beginY = 0;

  this.getPosition();
}

// 缩放相关
function handlePinTouchstart(e) {
  e.stopPropagation();
  e.preventDefault();
  this.target.addClass('dashed-border');
  const touch = e.originalEvent.touches[0];

  this.dispHeight = this.target.height();
  this.dispWidth = this.target.width();

  beginXP = touch.clientX;
  beginYP = touch.clientY;
}
function handlePinTouchmove(e) {
  e.stopPropagation();
  e.preventDefault();
  const tar = this.target;
  const touch = e.originalEvent.touches[0];
  let widthTemp = this.dispWidth + (touch.clientX - beginXP);
  let heightTemp = this.dispHeight + (touch.clientY - beginYP);
  if (widthTemp < 50) {
    console.log('宽度不能小于50');
    widthTemp = 50;
  }
  if (heightTemp < 50) {
    console.log('高度不能小于50');
    heightTemp = 50;
  }
  tar.css('width', `${widthTemp}px`).css('height', `${heightTemp}px`);
}
function handlePinTouchend() {
  this.target.removeClass('dashed-border');
  this.dispHeight = this.target.height();
  this.dispWidth = this.target.width();
  this.getSize();
  this.getPosition();
}

// 删除相关
function handleDel(e) {
  e.stopPropagation();
  e.preventDefault();
  const { id } = this;
  this.target.remove();
  this.signDeleteHandler && this.signDeleteHandler(id);
}

export default class Float {
  constructor(opt) {
    this.x = opt.x || 100; // 偏移
    this.y = opt.y || 100;
    this.width = 0; // 实际大小
    this.height = 0;
    this.dispWidth = 0; // 显示大小
    this.dispHeight = 0;
    this.target = null;// 当前操作的对象
    this.page = 0;// 当前的页数
    this.img = opt.img; // 当前的图片
    this.id = opt.id + (`${Date.now()}`).slice(-5, -1); // id
    this.canScale = opt.canScale !== undefined ? opt.canScale : true; // 能否缩放
    this.init();
  }

  init() {
    !hasCalculateDisplaySize && calculateDisplaySize().then(() => {
      // 在获取到相关尺寸之后获取签名的数据
      // this.getSize();
      // this.getPosition();
    });
    $('.pdfViewer').append(this.canScale ? `
      <div class='box' data-id=${this.id} class='box' style='left:${this.x}px;top:${this.y}px'>
        <img class='sign-img' src='${this.img}' />
        <div class='pin'><i class='iconfont icon-resize_'></i></div>
        <div class='del-btn'><i class='iconfont icon-delete'></i><div>
      </div>` : `
      <div class='box' data-id=${this.id} class='box' style='width:120px;height:40px'>
        <div class='sign-img' style="background:url(${this.img}) center / cover no-repeat;width:100%;height:100%;"></div>
        <div class='del-btn'><i class='iconfont icon-delete'></i><div>
      </div>`);
    // hack获取添加后的元素
    Promise.resolve().then(() => {
      this.target = $([].find.call($('.box'), ((item) => $(item).attr('data-id') === this.id))); // 当前操作的对象

      this.dispHeight = this.target.height();
      this.dispWidth = this.target.width();

      // this.width = this.target[0].offsetWidth;
      // this.height = this.target[0].offsetHeight;
      this.getSize();
      this.getPosition();
      this.bindEvent();
    });
  }

  // 获取大小
  getSize() {
    this.height = this.dispHeight / ratio;
    this.width = this.dispWidth / ratio;
    console.log(this);
  }

  // 获取位置
  getPosition() {
    const calcRes = calculatePosition.call(this);
    this.x = calcRes.x;
    this.y = calcRes.y;
    console.log(this);
  }

  bindEvent() {
    this.target.on('touchstart', '.sign-img', handleTouchstart.bind(this))
      .on('touchmove', '.sign-img', handleTouchmove.bind(this))
      .on('touchend', '.sign-img', handleTouchend.bind(this))
      .on('touchstart', '.pin', handlePinTouchstart.bind(this))
      .on('touchmove', '.pin', handlePinTouchmove.bind(this))
      .on('touchend', '.pin', handlePinTouchend.bind(this))
      .on('click', '.del-btn', handleDel.bind(this));
  }
}
