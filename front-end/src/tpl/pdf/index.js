/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-09 11:07:57
 * @LastEditTime: 2021-12-09 11:30:49
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/tpl/pdf/index.js
 * @Reference:
 */
import tpl from './index.tpl';
import './index.scss';
import tplReplace from '../../utils/tplReplace';

export default () => ({
  name: 'Pdf',
  render(data) {
    return tplReplace(tpl(), data);
  },
});
