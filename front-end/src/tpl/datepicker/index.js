/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-09 11:07:57
 * @LastEditTime: 2021-12-15 10:40:22
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/tpl/datepicker/index.js
 * @Reference:
 */
/* global $ */
import tpl from './index.tpl';
import './index.scss';
import dateFormat from '../../utils/time';

export default () => ({
  name: 'DatePicker',
  render() {
    return tpl().replace(/{{(.*?)}}/g, (node, key) => dateFormat(key));
  },
  show() {
    $('.J_datepicker-wrap').addClass('show');
  },
  hide() {
    $('.J_datepicker-wrap').removeClass('show');
  },
});
