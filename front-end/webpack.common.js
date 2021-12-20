/*
 * @Description: common webpack config
 * @Author: xuxin
 * @Date: 2021-11-18 21:02:16
 * @LastEditTime: 2021-12-16 10:27:09
 * @LastEditors: xuxin
 * @FilePath: /e-sign/front-end/webpack.common.js
 * @Reference:
 */
// eslint-disable-next-line
const HtmlWebpackPlugin = require('html-webpack-plugin');
// eslint-disable-next-line
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // 升级之后不是默认导出了
const path = require('path');

module.exports = {
  entry: {
    index: './src/index.js',
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['!static'],
    }),
    new HtmlWebpackPlugin({
      title: 'Project',
      template: path.resolve(__dirname, 'index.html'),
      chunks: ['index'],
    }),
  ],
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    assetModuleFilename: 'images/[name].[hash:5][ext]', // asset module 通用打包后输出的文件名
    clean: {
      keep: 'static',
    },
  },
};
