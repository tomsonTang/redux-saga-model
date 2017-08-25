'use strict';
const webpack = require('webpack');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const util = require('react-boilerplate-app-utils');
const scriptsPackagename = 'react-boilerplate-app-scripts';
const paths = require(util.pathResolve('config/paths.js', scriptsPackagename));

//bebin-----------packageJson信息获取
const packageJson = util.getCwdPackageJson();
function getInfo(packageId) {
  return !!(
    (packageJson.dependencies && packageJson.dependencies[packageId]) ||
    (packageJson.devDependencies && packageJson.devDependencies[packageId])
  );
}
const useSass = getInfo('sass-loader') && getInfo('node-sass');
const useLess = getInfo('less') && getInfo('less-loader');
const useImmutable = getInfo('immutable') && getInfo('redux-immutable');
//end  -----------packageJson信息获取
const cwdPackageJsonConfig = util.getDefaultCwdPackageJsonConfig(
  scriptsPackagename
);

const postcssLoaderConfig = {
  loader: 'postcss-loader',
  options: {
    sourceMap: true,
    ident: 'postcss',
    plugins: () => [
      autoprefixer({
        browsers: [
          '>1%',
          'last 4 versions',
          'Firefox ESR',
          // React doesn't support IE8 anyway
          'not ie < 9'
        ]
      })
    ]
  }
};

const entry = [
  'react-hot-loader/patch',
  //热替换入口文件
  'webpack-dev-server/client',
  // bundle the client for hot reloading
  // only- means to only hot reload for successful updates
  'webpack/hot/only-dev-server',
  paths.appEntry
];

//webpack配置项
var config = {
  devtool: 'cheap-module-source-map',
  //隐藏终端的warning信息
  performance: {
    hints: false
  },
  entry: {
    app: entry
  },
  output: {
    filename: 'bundle.js?hash=[hash]',
    //js打包输出目录，以package.json为准，是用相对路径
    path: paths.appBuild,
    //内存和打包静态文件输出目录，以index.html为准,使用绝对路径，最好以斜杠/结尾，要不有意想不到的bug
    publicPath: '/',
    //定义require.ensure文件名
    chunkFilename: '[name]-[id]-[chunkHash].chunk.js',
    libraryTarget: 'var',
    sourceMapFilename: '[file].map'
  },
  module: {
    rules: [
      //匹配到rquire中以.css结尾的文件则直接使用指定loader
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', postcssLoaderConfig]
      },
      //字体等要经过file-loader提取到指定目录
      {
        //特别留意这里，如果有新的loader后缀名，都会优先经过这里
        //需要在这里过滤调，如.less，.scss
        exclude: [
          /\.html$/,
          /\.(js|jsx)$/,
          /\.(ts|tsx)$/,
          /\.css$/,
          /\.less$/,
          /\.scss/,
          /\.json$/,
          /\.bmp$/,
          /\.gif$/,
          /\.jpe?g$/,
          /\.png$/,
          /\.svg$/,
          /\.webp$/
        ],
        loader: 'file-loader',
        options: {
          name: 'static/media/[name].[hash:8].[ext]'
        }
      },
      //limit是base64转换最大限制，小于设置值，都会转为base64格式
      //name是在css中提取图片的命名方式
      //目前设置.bmp、.git、.jpe(g)、.png转换
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg/, /\.webp$/],
        //[path]是以publicPath为准
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'static/media/[name].[hash].[ext]'
        }
      },
      {
        //确保在babel转换前执行
        enforce: 'pre',
        test: /\.js[x]?$/,
        exclude: /node_modules/,
        loader: 'eslint-loader'
      },
      {
        //匹配.js或.jsx后缀名的文件
        test: /\.js[x]?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  externals: {},
  resolve: {
    alias: {
      src: paths.src
    },
    //不可留空字符串
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml
    }),
    new webpack.DefinePlugin({
      'process.env.PREFIX_URL': JSON.stringify(cwdPackageJsonConfig.prefixURL),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      useImmutable: JSON.stringify(useImmutable),
      'process.env.useImmutable': JSON.stringify(useImmutable)
    }),
    new webpack.HotModuleReplacementPlugin(),
    // prints more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin(),
    new ProgressBarPlugin(),
    new CaseSensitivePathsPlugin()
  ]
};
//使用sass配置
if (useSass) {
  config.module.rules.push({
    test: /\.scss$/,
    use: [
      'style-loader',
      'css-loader',
      postcssLoaderConfig,
      {
        loader: 'sass-loader',
        options: {
          sourceMap: true
        }
      }
    ]
  });
}
//使用less配置
if (useLess) {
  config.module.rules.push({
    test: /\.less$/,
    use: [
      'style-loader',
      'css-loader',
      postcssLoaderConfig,
      {
        loader: 'less-loader',
        options: {
          sourceMap: true
        }
      }
    ]
  });
}

module.exports = config;
