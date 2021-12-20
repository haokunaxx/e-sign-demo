/*
 * @Description: postcss config
 * @Author: xuxin
 * @Date: 2021-11-19 09:38:27
 * @LastEditTime: 2021-11-19 15:07:45
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/postcss.config.js
 * @Reference:
 */
module.exports = {
  plugins: [
    // require('autoprefixer')(),
    'postcss-preset-env', // require('postcss-preset-env')()的简写：'postcss-preset-env',运行时也是require的方式运行。内置了autoprefixer 所以可以不用再使用autoprefixer
  ],
};
