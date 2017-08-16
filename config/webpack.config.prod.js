'use strict';
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
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

//webpack配置项
var config = {
  //任何错误立即终止
  bail: true,
  devtool: 'source-map',
  //隐藏终端的warning信息
  performance: {
    hints: false
  },
  entry: {
    app: paths.appEntry
  },
  output: {
    filename: 'static/js/bundle.js?hash=[hash]',
    //js打包输出目录，以package.json为准，是用相对路径
    path: paths.appBuild,
    //内存和打包静态文件访问目录，以index.html为准,最好以斜杠/结尾，要不有意想不到的bug
    //因为有些网站访问web app不是在根目录，可能是根目录中的的文件夹，prefixURL是用来设置这种情况的
    //例如`/demo`，访问网站根目录demo文件中的web app
    publicPath: `${cwdPackageJsonConfig.prefixURL}` || '/',
    //定义require.ensure文件名
    chunkFilename: 'static/js/[name]-[id]-[chunkHash].chunk.js',
    libraryTarget: 'var',
    sourceMapFilename: '[file].map'
  },
  module: {
    rules: [
      //匹配到rquire中以.css结尾的文件则直接使用指定loader
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', postcssLoaderConfig]
        })
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
      //目前设置.bmp、.git、.jpe(g)、.png、.svg、.webp转换
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
      template: paths.appHtml,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),
    new webpack.DefinePlugin({
      'process.env.PREFIX_URL': JSON.stringify(cwdPackageJsonConfig.prefixURL),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.useImmutable': JSON.stringify(useImmutable)
    }),
    // This helps ensure the builds are consistent if source hasn't changed:
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.LoaderOptionsPlugin({
      // optionally pass test, include and exclude, default affects all loaders
      test: /\.css|.js|.jsx|.scss$/,
      minimize: true,
      debug: false
    }),
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new ExtractTextPlugin({
      filename: 'static/css/styles.css?hash=[hash]',
      //最好true,要不后面加上sass-loader等时，会出现css没有提取的现象
      allChunks: true
    }),
    new ProgressBarPlugin(),
    new CaseSensitivePathsPlugin()
  ]
};
//使用sass配置
if (useSass) {
  config.module.rules.push({
    test: /\.scss$/,
    loader: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: ['css-loader', postcssLoaderConfig, 'sass-loader']
    })
  });
}
//使用sass配置
if (useLess) {
  config.module.rules.push({
    test: /\.scss$/,
    loader: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: ['css-loader', postcssLoaderConfig, 'less-loader']
    })
  });
}

module.exports = config;
