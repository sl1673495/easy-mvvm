const path = require('path');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const pxtorem = require('postcss-pxtorem')
const autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HappyPack = require('happypack');
const ModuleConcatenationPlugin = require('webpack/lib/optimize/ModuleConcatenationPlugin');

module.exports = {
  // JS 执行入口文件
  entry: {
    app: './app/main.js',
  },
  output: {
    // 把所有依赖的模块合并输出到一个 bundle.js 文件
    filename: 'js/[name].js',
    // 输出文件都放到 dist 目录下
    path: path.resolve(__dirname, './dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['happypack/loader?id=babel'],
      },
      {
        // 用正则去匹配要用该 loader 转换的 css 文件
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          // 转换 .css 文件需要使用的 Loader
          use: [
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss', // https://webpack.js.org/guides/migrating/#complex-options
                plugins: () => [
                  autoprefixer({
                    browsers: ['last 2 versions', 'Firefox ESR', '> 1%', 'ie >= 8', 'iOS >= 8', 'Android >= 4'],
                  }),
                  pxtorem({
                    rootValue: 14,
                    propWhiteList: [],
                  }),
                ],
              }
            }
          ],
        }),
      },
      {
        test: /\.(gif|jpe?g|png)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              // 30KB 以下的文件采用 url-loader
              limit: 1024 * 30,
              // 否则采用 file-loader，默认值就是 file-loader 
              fallback: 'file-loader',
              name: 'assets/images/[name].[hash:16].[ext]',
            },
          },
        ]
      }
    ]
  },
  resolve: {
    alias: {
      'easyMvvm': path.resolve(__dirname, './easyMvvm'),
    },
    // 针对 Npm 中的第三方模块优先采用 jsnext:main 中指向的 ES6 模块化语法的文件
    mainFields: ['jsnext:main', 'browser', 'main'],
    extensions: ['.js', '.json']
  },
  plugins: [
    new HappyPack({
      // 用唯一的标识符 id 来代表当前的 HappyPack 是用来处理一类特定的文件
      id: 'babel',
      // 如何处理 .js 文件，用法和 Loader 配置中一样
      loaders: ['babel-loader'],
      // ... 其它配置项
    }),
    new ExtractTextPlugin({
      // 从 .js 文件中提取出来的 .css 文件的名称
      filename: `css/[name].css`,
    }),
    new HtmlWebpackPlugin({
      chunks: ['app', 'common'],
      filename: 'index.html',
      template: 'app/index.html',
    }),
    new CommonsChunkPlugin({
      // 从哪些 Chunk 中提取
      chunks: ['app'],
      // 提取出的公共部分形成一个新的 Chunk，这个新 Chunk 的名称
      name: 'common'
    }),
    new ModuleConcatenationPlugin(),
  ]
};
