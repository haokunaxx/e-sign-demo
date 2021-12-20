/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-09 11:07:57
 * @LastEditTime: 2021-12-15 18:02:21
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/tpl/draw/index.js
 * @Reference:
 */
/* global $ */
/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true , "allowTernary": true }] */
import tpl from './index.tpl';
import './index.scss';
import tplReplace from '../../utils/tplReplace';

export default () => ({
  name: 'Draw',
  tpl: `
    <li class="sig-item exist-signature" data-id='{{id}}' content='签名'>
        <img src="{{img}}" alt="">
    </li>
  `,
  reFresh(data) {
    let listStr = '';
    data && data.forEach((item) => {
      listStr += tplReplace(this.tpl, item);
    });
    $('.J_sig-list').append(listStr);
  },
  render(data) {
    let listStr = '';
    data && data.forEach((item) => {
      listStr += tplReplace(this.tpl, item);
    });
    return tplReplace(tpl(), {
      signList: listStr,
    });
  },
  toggle(flag) {
    const draw = $('.J_draw');
    if (flag) {
      draw.css('transform', `translate3d(0,-${draw.height()}px,0)`);
    } else {
      draw.css('transform', 'translate3d(0,0,0)');
    }
  },
});
