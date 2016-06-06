'use strict';

const webpack = require("webpack");
const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const mode = process.env.MODE;

let config = {
  entry: "index",
  output: {
    path: "./frontend/js/",
    filename: "SolitaireEngine.js",
    library:  "SolitaireEngine"
  },
  watchOptions: {
		aggregateTimeout: 100
	},
  resolve: {
		modulesDirectories: [
			'./sources/'                  ,
			'./sources/common/'           ,
			'./sources/group/'            ,
			'./sources/group/generators/' ,
			'./sources/deck/'             ,
			'./sources/deck/actions/'     ,
			'./sources/tips/'             ,
			'./sources/history/'          ,
			'./sources/dom/'              ,
			'./sources/dom/render/'       ,
      './sources/styles/'           ,
      './sources/tests/'            ,
			'./sources/preferences/'      
		],
		extensions: ['', '.js']
  },
  module: {
    loaders: [
	  {
        test:   /\.js$/,
        loader: 'babel',
		query: {
			presets: ['es2015']
		}
      },
      // {
      //   test: /\.css$/,
      //   loader: ExtractTextPlugin.extract('css!')
      // },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', 'css!sass')
      },
      {
        test:   /\.(svg|png|jpg|jpeg|eot|ttf|woff|woff2)$/,
        loader: 'url=loader?limit=10000'
      }
      // {
      //   test:   /\.(png|jpg|svg|ttf|eot|woff|woff2)$/,
      //   loader: 'file?name=../img/[name].[ext]'
      // }
    ]
  },
  plugins: [
  	new ExtractTextPlugin("../css/SolitaireEngine.css", {
  		allChunks: true
  	})
  ]
};

if(mode == 'dev') {

  config.watch = true;

  config.devtool = "source-map";

  let fs = require('fs');
  let _file = './package.json';
  let _json = require(_file);
  let _ver = _json.version.split('.');
  _ver[_ver.length - 1] = (_ver[_ver.length - 1]|0) + 1;
  _json.version = _ver.join('.');
  fs.writeFile(_file, JSON.stringify(_json, null, 2));
} else {

  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      drop_console: true,
      unsafe:       true
    }));
};

module.exports = config;