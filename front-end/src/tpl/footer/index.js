/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-09 11:07:57
 * @LastEditTime: 2021-12-09 11:32:45
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/tpl/footer/index.js
 * @Reference:
 */
import tpl from './index.tpl';
import './index.scss';
import tplReplace from '../../utils/tplReplace';

export default () => ({
  name: 'Footer',
  render(data) {
    return tplReplace(tpl(), data);
  },
});
