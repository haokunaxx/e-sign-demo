/*
 * @Description: development webpack config
 * @Author: xuxin
 * @Date: 2021-11-18 21:02:05
 * @LastEditTime: 2021-12-16 10:40:01
 * @LastEditors: xuxin
 * @FilePath: /e-sign/front-end/webpack.dev.js
 * @Reference:
 */
const { resolve } = require('path');
// eslint-disable-next-line
const { merge } = require('webpack-merge');
// eslint-disable-next-line
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// eslint-disable-next-line
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');
// eslint-disable-next-line
// const ESlintPlugin = require('eslint-webpack-plugin');

const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  optimization: {
    moduleIds: 'deterministic', // 依赖没有改变打包后的vendor文件（依赖于自身module.id的变化）也应该是不变的，加上此项修复，但是webpack5好像不加也可以
    runtimeChunk: 'single', // 生产一个运行时依赖脚本

    // 抽离各个入口文件中的公共依赖。将公共的依赖模块提取到已有的入口 chunk 中，或者提取到一个新生成的 chunk
    splitChunks: {
      // chunks: 'all'        //抽离entry文件中的公共代码，
      cacheGroups: { // 缓冲引用的外部库fd442
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  module: {
    rules: [
      /*
              推荐 production 环境的构建将 CSS 从你的 bundle 中分离出来，这样可以使用 CSS/JS 文件的并行加载。
              这可以通过使用 mini-css-extract-plugin 来实现，因为它可以创建单独的 CSS 文件。
              对于 development 模式（包括 webpack-dev-server），你可以使用 style-loader，
              因为它可以使用多个 标签将 CSS 插入到 DOM 中，并且反应会更快。
              **** 但是 **** 不要同时使用 style-loader 与 mini-css-extract-plugin。
          */
      {
        test: /\.css$/,
        exclude: [
          resolve(__dirname, 'static/css'),
        ],
        // use:['css-loader'],  //将入口js文件中引入的css文件打包到bundlejs文件中去
        // eslint-disable-next-line
        // use:['style-loader','css-loader'],   //将入口js文件中引入的css文件打包到bundlejs中去，在打开打包后的index.html文件会发现样式被添加到head的style标签内部
        use: [
          // eslint-disable-next-line
          MiniCssExtractPlugin.loader, // 将js文件中引用的css文件抽取成一个独立的css文件，并在index.html中引入。和style-loader有冲突，所以替换掉style-loader使用
          {
            loader: 'css-loader',
            options: {
              // eslint-disable-next-line
              importLoaders: 1, // css-loader处理.css文件内部应用其他样式文件的时候，对这些文件先用什么loader进行处理。1表示先用此css-loader的前一个loader（此处为postcss-loader）先处理 然后再按配置流回次css-loader
            },
          },
          'postcss-loader',
          /*
            postcss-loader工作原理：一开始遇到js中引用的css文件后，根据当前规则，由postcss-loader先进行处理。
            postcss-loader会为配置的环境自动添加兼容性前缀，
            但是，如果css文件中遇到@import指令引入的文件，由于是css语法（css-loader会去处理），所以postcss-loader不会对其进行处理
            所以如果需要css文件中@import引入的文件也经由postcss-loader处理，需要修改css-loader的配置。
          */
        ],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
            },
          },
          'postcss-loader',
          'sass-loader',
        ],
      },
      // {
      //     test:/\.(png|jpg|jpeg|gif|svg)$/,
      //     use:{
      //   loader:'url-loader', //与file-loader类似，此处使用url-loader的原因是可以指定limit，是的小于limit的图片可以转成dataURL
      //         options:{
      //   publicPath:'images', //设置打包后图片应用的路径前缀。
      //   为test时，imgSrc为 .../dist/test/1.abcde.jpg。不设置默认为'dist',设置了outputPath则和outputPath一致
      //             outputPath:'images',        //文件输出的路径
      //             name:'[name].[contenthash:5].[ext]',
      //             limit: 8 * 1024             //小于limit将图片转换成DataURL
      //         },
      //     },
      //     type:'javascript/auto'
      //     webpack5中有处理asset的asset Module，添加此项可以使用旧的loader模式的同时，停止asset模块的处理。
      // },
      {
        test: /\.(jpg|jpeg|png|gif|svg)$/,
        type: 'asset', // 小于maxSize（默认为8k）的时候 使用asset/inline进行处理（转成DataURL），否则使用asset/resource
        parser: {
          dataUrlCondition: {
            maxSize: 4 * 1024, // 修改成4k
          },
        },
      },
      {
        test: /\.txt$/, // 导出资源的源代码，loader的处理方式需要使用raw-loader
        type: 'asset/source', // 导出资源的源代码
      },
      {
        test: /\.(woff|woff2|ttf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:5][ext]', // 匹配的文件打包后生成的文件名
        },
      },
      {
        test: /\.tpl$/,
        loader: 'ejs-loader',
        options: {
          esModule: false,
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [
          resolve(__dirname, 'static/js'),
          /[\\/]node_modules[\\/]/,
        ],
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                useBuiltIns: 'usage',
                corejs: {
                  version: '3',
                },
                targets: {
                  chrome: '60',
                  ie: '9',
                  safari: '10',
                  firefox: '60',
                  edge: '17',
                },
              },
            ],
          ],
        },
      },
    ],
  },
  plugins: [
    // new ExtractTextPlugin('style.css')
    // new ESlintPlugin({
    //   extensions: ['js'],
    //   // exclude: 'node_modules',
    // }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css', // 多个入口文件的时候输出的filename才会以对应入口文件的名称来命名，否则就是main.css
      // insert:"#headTitle",             //将异步的link插入指定的元素下方。 例如动态import的css会插入到id为headTitle的元素下
      // chunkFilename:'chunk.[name].css'        //?未知
    }),
    new CssMinimizerWebpackPlugin(), // 压缩css代码，内部使用cssnano
  ],
  devServer: {
    port: '8080',
    static: resolve(__dirname, './'),
    hot: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
  resolve: {
    fallback: {
      http: require.resolve('stream-http'),
    },
  },
});
