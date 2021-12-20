/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-09 11:07:57
 * @LastEditTime: 2021-12-15 18:12:19
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/tpl/mask/index.js
 * @Reference:
 */
// import $ from 'jquery';
/* global $ */
import tpl from './index.tpl';
import './index.scss';
import tplReplace from '../../utils/tplReplace';

export default () => ({
  name: 'Mask',
  render(data) {
    return tplReplace(tpl(), data);
  },
  toggle(flag) {
    if (flag) {
      $('.J_mask').fadeIn();
    } else {
      $('.J_mask').fadeOut();
    }
  },
});
