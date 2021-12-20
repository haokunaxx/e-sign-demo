/* global $, window */
/* eslint no-use-before-define: ["error", { "classes": false }] */
/* eslint class-methods-use-this: ["error", {"exceptMethods":[ "signDeleteHandler" ]} ] */
/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true , "allowTernary": true }] */
import Canvas from '../plugins/sign';
import Header from '../tpl/header';
import Sign from '../tpl/sign';
import eb from '../utils/eventbus';
// signPageRelated 签名页面相关逻辑,由于是javascript模拟单页应用,并且只写在同一个页面上,并没有涉及状态管理等其他东西,所以此处简简单单将代码写在同一个js文件中.
let canvas;
const signPage = $('#sign-page');
const header = Header();
const sign = Sign();
// 渲染
const renderSignPage = () => new Promise((resolve) => {
  let domStr = '';
  domStr += header.renderHeader();
  domStr += sign.render();
  signPage.append(domStr);
  resolve();
});
  // 修改签字颜色
const changeSignColor = (e) => {
  const tar = $(e.currentTarget);
  !tar.hasClass('checked') && tar.addClass('checked').siblings().removeClass('checked') && canvas.changePenColor(tar.attr('data-color'));
};
  // 修改签字粗细
const changeSignWidth = (e) => {
  const tar = $(e.currentTarget);
  !tar.hasClass('checked') && tar.addClass('checked').siblings().removeClass('checked') && canvas.changePenWidth(tar.attr('data-width'));
};
  // 重新签名和保存签名
const handleSignFuncGroupClick = async (e) => {
  if ($(e.currentTarget).hasClass('rewrite')) {
    canvas.rewrite();
  } else {
    // 清除原本的签名列表 => 保存当前签名 => 添加到local => 重新获取所有签名 => 返回 => 清空当前画布
    $('.J_draw').find('.exist-signature').remove();
    await canvas.save();
    eb.emit('freshDraw');
    window.history.go(-1);
    canvas.clearCanvas();
    canvas.drawBaseText();
  }
};
  // 签名页返回
const handleBack = () => {
  window.history.go(-1);
  canvas.clearCanvas();
  canvas.drawBaseText();
};
  // 签名页面事件绑定
const bindSignEvent = () => {
  $('.group-color-picker').on('click', '.item', changeSignColor);
  $('.group-font-size-picker').on('click', '.item', changeSignWidth);
  $('.group-confirm-rewrite').on('click', '.item', handleSignFuncGroupClick);
  $('#sign-page .header').on('click', '.back-func', handleBack);
};

function init() {
  renderSignPage().then(() => {
    canvas = new Canvas({
      space: {
        left: $('#sign-page .func-wrap').width(),
        top: $('#sign-page .header').height(),
      },
      line: {
        color: '#000',
        width: 1,
      },
    });
    bindSignEvent();
    eb.on('showSignPage', () => {
      signPage.addClass('show');
    });
    window.addEventListener('popstate', () => {
      signPage.removeClass('show');
    });
  });
}

export default init;
