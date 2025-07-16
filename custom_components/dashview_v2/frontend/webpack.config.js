const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const isProduction = process.env.NODE_ENV === 'production';
const enableAnalyzer = process.env.ANALYZE === 'true';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    'dashview-v2-panel': './src/panel-entry.ts',
  },
  output: {
    path: path.resolve(__dirname, '../panel'),
    filename: '[name].js',
    library: 'DashviewV2',
    libraryTarget: 'umd',
    libraryExport: 'default',
    publicPath: '/local/dashview-v2/',
  },
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  resolve: {
    extensions: ['.ts', '.js', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            experimentalWatchApi: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: false,
              importLoaders: 1,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  ['autoprefixer', {}],
                  ['cssnano', { preset: 'default' }],
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
      },
    ],
  },
  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction,
            drop_debugger: isProduction,
            pure_funcs: ['console.log', 'console.debug'],
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        lit: {
          test: /[\\/]node_modules[\\/](lit|@lit)[\\/]/,
          name: 'vendor-lit',
          priority: 10,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 1,
        },
      },
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    ...(isProduction
      ? [
          new MiniCssExtractPlugin({
            filename: '[name].css',
          }),
          new CompressionPlugin({
            test: /\.(js|css|html|svg)$/,
            algorithm: 'gzip',
          }),
        ]
      : []),
    ...(enableAnalyzer
      ? [
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../build-reports/bundle-analysis.html',
          }),
        ]
      : []),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, '../panel'),
    },
    compress: true,
    port: 8123,
    hot: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8123',
        changeOrigin: true,
      },
    },
  },
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};