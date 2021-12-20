/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-09 10:33:14
 * @LastEditTime: 2021-12-16 09:30:08
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/request/index.js
 * @Reference:
 */
import axios from 'axios';

const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

service.interceptors.request.use((config) => config, (err) => Promise.reject(err));

service.interceptors.response.use((res) => res.data, (err) => Promise.reject(err));

export default service;
