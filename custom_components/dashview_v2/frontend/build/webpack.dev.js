const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, '../dist'),
    },
    compress: true,
    port: 4001,
    hot: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8123',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8123',
        changeOrigin: true,
      },
      '/local': {
        target: 'http://localhost:8123',
        changeOrigin: true,
      },
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  optimization: {
    runtimeChunk: 'single',
  },
});