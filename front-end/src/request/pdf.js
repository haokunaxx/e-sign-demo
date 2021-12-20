/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-09 10:38:01
 * @LastEditTime: 2021-12-16 11:17:25
 * @LastEditors: xuxin
 * @FilePath: /e-sign/front-end/src/request/pdf.js
 * @Reference:
 */
import request from '.';

export default function compoundPdf(data) {
  return request({
    url: 'pdf/compound',
    method: 'post',
    data,
  });
}
