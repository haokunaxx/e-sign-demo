/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-15 10:26:05
 * @LastEditTime: 2021-12-15 10:41:24
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/utils/time.js
 * @Reference:
 */
export default function dateFormat(format = 'YYYY-MM-DD', date = new Date()) {
  const obj = {
    'Y+': date.getFullYear(),
    'M+': date.getMonth() + 1,
    'D+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
  };
  Object.keys(obj).forEach((key) => {
    // eslint-disable-next-line
    format = format.replace(new RegExp(`(${key})`), (node, $1) => String(obj[key]).padStart($1.length, '0'));
  });
  return format;
}
