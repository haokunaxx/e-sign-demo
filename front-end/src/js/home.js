/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-15 20:23:29
 * @LastEditTime: 2021-12-16 11:17:55
 * @LastEditors: xuxin
 * @FilePath: /e-sign/front-end/src/js/home.js
 * @Reference:
 */
/* global $, FormData, window */
/* eslint no-use-before-define: ["error", { "classes": false }] */
/* eslint class-methods-use-this: ["error", {"exceptMethods":[ "signDeleteHandler" ]} ] */
/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true , "allowTernary": true }] */
import Header from '../tpl/header';
import Pdf from '../tpl/pdf';
import Footer from '../tpl/footer';
import Draw from '../tpl/draw';
import DatePicker from '../tpl/datepicker';
import Mask from '../tpl/mask';
import Loading from '../tpl/loading';

import _Float from '../plugins/float';

import { dataURLToFile, getPicFromCustomText } from '../utils/dataURLToFile';
import compoundPdf from '../request/pdf';
import renderPdf from '../utils/pdfRender';
import { getFromStorage } from '../utils/localStorage';

import eb from '../utils/eventbus';

const container = $('#container');
const header = Header();
const pdf = Pdf();
const footer = Footer();
const draw = Draw();
const datePicker = DatePicker();
const mask = Mask();
const loading = Loading();

let signArr;
let floatArr = [];
let specifiedPos = null; // 指定签名摆放的位置,默认为x:100 y:100

// 继承Float类,添加删除回调
class Float extends _Float {
  signDeleteHandler(id) {
    floatArr = floatArr.filter((item) => item.id !== id);
  }
}
// event handler
// 签名列表draw打开/关闭
const drawToggleHandler = (flag) => {
  draw.toggle(flag);
  mask.toggle(flag);
};

// 添加签名
const addSignatureHandler = (e) => {
  const tar = $(e.currentTarget);
  const signItem = signArr.find((item) => item.id === tar.attr('data-id'));
  if (!signItem) return;
  floatArr.push(new Float({ ...signItem, ...specifiedPos || {} }));
  drawToggleHandler();
};

// 显示签名页面(手写)
const showSignPage = () => {
  // eslint-disable-next-line
  window && window.history.pushState({}, null, '/sign');
  eb.emit('showSignPage');
  // signPage.addClass('show');
};

// 弹出时间选择器
const showDatePicker = () => {
  mask.toggle(true);
  datePicker.show();
};

// 隐藏时间选择器
const datepickerCloseHandler = () => {
  mask.toggle(false);
  datePicker.hide();
};

// 添加时间签名
const addTimeHandler = (e) => {
  const tar = $(e.currentTarget);
  floatArr.push(new Float({
    id: (`${Math.random()}`).slice(2, 5) + (`${Date.now()}`).slice(-5, -1),
    img: getPicFromCustomText(tar.text()),
    canScale: false,
  }));
  datepickerCloseHandler();
};

// 完成签署
const confirmHandler = async () => {
  console.log(floatArr);
  const getFile = () => {
    const len = floatArr.length;
    let idx = 0;
    return new Promise((resolve) => {
      floatArr.forEach(async (item) => {
        // eslint-disable-next-line
        item.file = await dataURLToFile(item.img);
        // eslint-disable-next-line
        idx++;
        if (idx === len) {
          resolve();
        }
      });
    });
  };
  await getFile();
  const formdata = new FormData();
  const configArr = [];
  // eslint-disable-next-line
  for (let i = 0, len = floatArr.length; i < len; i++) {
    formdata.append('imgs', floatArr[i].file);
    configArr.push({
      x: floatArr[i].x,
      y: floatArr[i].y,
      width: floatArr[i].width,
      height: floatArr[i].height,
      page: floatArr[i].page,
    });
  }
  formdata.append('config', JSON.stringify(configArr));
  const res = await compoundPdf(formdata);
  // console.log('确认签署');
  $('.J_footer').hide();
  $('.pdf-preview-wrap').css('padding-bottom', 0);
  renderPdf('#preview', `/api/pdf/getpdf/${res.filename}`).on('complete', () => {

  });
};

// pdf点击事件: 记录点击位置 => 打开签名列表draw
const handlePdfPageClick = (e) => {
  const { clientX, clientY } = e;
  specifiedPos = {
    x: clientX - parseInt($('.pdfViewer').css('padding-left'), 10),
    y: clientY + $('.viewerContainer')[0].scrollTop - $('.header').height() - parseInt($('.pdfViewer').css('padding-top'), 10),
  };
  drawToggleHandler(true);
};

// 遮罩层点击
const maskClickHandler = () => {
  drawToggleHandler();
  datepickerCloseHandler();
};

const render = () => new Promise((resolve) => {
  let domStr = '';
  domStr += header.renderHeader();
  domStr += pdf.render();
  domStr += footer.render();
  domStr += draw.render(signArr);
  domStr += datePicker.render();
  domStr += mask.render();
  domStr += loading.render();
  container.append(domStr);
  resolve();
});
const bindEvent = () => {
  // 首页footer点击事件
  $('.J_footer').on('click', '.add-btn', drawToggleHandler.bind(null, true)) // footer按钮点击事件
    .on('click', '.confirm-btn', confirmHandler)
    .on('click', '.sign-btn', showSignPage)
    .on('click', '.date-btn', showDatePicker);

  // draw事件代理
  $('.J_draw').on('click', '.close-btn', drawToggleHandler.bind(this, false)) // draw关闭按钮点击事件
    .on('click', '.exist-signature', addSignatureHandler)
    .on('click', '.add-signature', drawToggleHandler, showSignPage);

  // mask遮罩层事件
  $('.J_mask').on('click', maskClickHandler);

  // $('#preview').on('del-sign', signDeleteHandler);

  // 时间选择器点击事件
  $('.J_datepicker-wrap').on('click', '.cancel', datepickerCloseHandler)
    .on('click', '.candidate-item', addTimeHandler);

  // pdf点击事件
  $('.pdfViewer').on('click', handlePdfPageClick);

  eb.on('freshDraw', () => {
    signArr = getFromStorage('signArr');
    draw.reFresh(signArr);
  });
};
async function init() {
  return new Promise((resolve) => {
    signArr = getFromStorage('signArr');
    render().then(() => {
      renderPdf('#preview', '/api/pdf/default').on('complete', () => {
        bindEvent();
        resolve();
      });
    });
  });
}

export default init;
