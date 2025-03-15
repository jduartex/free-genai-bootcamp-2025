const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|mp3|ogg|wav)$/,
        use: 'file-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'process': 'process/browser'
    },
    fallback: {
      "os": false,
      "crypto": false,
      "fs": false,
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/")
    }
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/'
      }
    ],
    compress: true,
    port: 8080,
    hot: true
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Aztec Escape'
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/assets', to: 'assets', noErrorOnMissing: true },
        { from: 'public', to: '.', noErrorOnMissing: true }
      ]
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    // Add buffer plugin for browser compatibility
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    // Add a plugin to define process.env
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};
