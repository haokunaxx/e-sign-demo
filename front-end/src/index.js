/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-15 20:32:33
 * @LastEditTime: 2021-12-15 20:51:12
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/index.js
 * @Reference:
 */
// reset style
import './css/index.scss';
import './fonts/iconfont.css';
import './css/float.scss';

import homeInit from './js/home';
import signInit from './js/sign';

(function init() {
  homeInit().then(() => {
    signInit();
  });
}());
