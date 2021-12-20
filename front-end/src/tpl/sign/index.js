/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-10 16:29:28
 * @LastEditTime: 2021-12-15 18:03:17
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/tpl/sign/index.js
 * @Reference:
 */
/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-09 11:07:57
 * @LastEditTime: 2021-12-09 15:51:32
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/tpl/mask/index.js
 * @Reference:
 */
import tpl from './index.tpl';
import './index.scss';
import tplReplace from '../../utils/tplReplace';

export default () => ({
  name: 'SignPage',
  render(data) {
    return tplReplace(tpl(), data);
  },
});
