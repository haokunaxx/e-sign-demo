/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-14 10:05:01
 * @LastEditTime: 2021-12-14 10:37:53
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/utils/localStorage.js
 * @Reference:
 */
/* global localStorage */
export function addToStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function pushToStorage(key, val) {
  const old = localStorage.getItem(key);
  let oldObj;
  if (old) {
    oldObj = JSON.parse(old);
  }
  if (Object.prototype.toString.call(oldObj) !== '[object Array]') {
    throw Error('source value must be Array');
  }
  oldObj.push(val);
  localStorage.setItem(key, JSON.stringify(oldObj));
}

export function removeStorage(key) {
  localStorage.removeItem(key);
}

export function getFromStorage(key) {
  const temp = localStorage.getItem(key);
  return temp ? JSON.parse(temp) : null;
}
