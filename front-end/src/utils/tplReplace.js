/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-09 11:15:32
 * @LastEditTime: 2021-12-09 11:15:32
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/utils/tplReplace.js
 * @Reference:
 */
export default (tpl, data) => (data ? tpl.replace(/{{(.*?)}}/g, (node, key) => data[key]) : tpl);
