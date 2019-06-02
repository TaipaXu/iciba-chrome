/*
 * GNU General Public License, Version 3.0
 *
 * Copyright (c) 2019 Taipa Xu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const path = require('path');
const webpack = require('webpack');
const fg = require('fast-glob');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

function resolve(dir) {
    return path.join(__dirname, '.', dir);
}

const isDevMode = process.env.NODE_ENV === 'development';

const config = {
    stats: {
        entrypoints: false,
        children: false,
    },
    devtool: isDevMode ? 'eval-source-map' : false,
    context: path.resolve(__dirname, './src'),
    entry: {
        background: './background/index.js',
        options: './options/index.js',
        popup: './popup/index.js',
        content: './content/all.js',
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        // publicPath: '.',
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.tpl.html$/,
                exclude: /node_modules/,
                use: { loader: 'raw-loader' },
            },
            {
                test: /\.(js|vue)$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                include: [resolve('src')],
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['vue-style-loader', 'css-loader'],

            },
            {
                test: /\.scss$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.styl$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'stylus-loader',
                ],
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'url-loader',
                options: {
                    name: '[name].[ext]?[hash]',
                },
            },
            {
                test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: 'media/[name].[hash:7].[ext]',
                },
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'file-loader',
                options: {
                    limit: 10000,
                    name: 'fonts/[name].[hash:7].[ext]',
                },
            },
        ],
    },
    resolve: {
        alias: {
            vue$: 'vue/dist/vue.runtime.esm.js',
            '@': path.resolve(__dirname, './', 'src'),
            '@utils': path.resolve(__dirname, './src', 'utils'),
        },
        extensions: ['.js', '.vue'],
    },
    plugins: [
        new VueLoaderPlugin(),
        new ExtractTextPlugin({
            filename: '[name].css',
        }),
        new CopyWebpackPlugin([{
            from: 'assets',
            to: 'assets',
        }, {
            from: 'manifest.json',
            to: 'manifest.json',
            flatten: true,
        }, {
            from: '_locales',
            to: '_locales',
        },
        ]),
        new HtmlWebpackPlugin({
            title: 'Options',
            template: './index.html',
            inject: true,
            chunks: ['options'],
            filename: 'options.html',
        }),
        new HtmlWebpackPlugin({
            title: 'Popup',
            template: './index.html',
            inject: true,
            chunks: ['[name]', 'popup'],
            filename: 'popup.html',
        }),
    ],
};

if (isDevMode) {
    config.plugins.push(
        new webpack.HotModuleReplacementPlugin(),
    );
} else {
    config.plugins.push(
        new ScriptExtHtmlWebpackPlugin({
            async: [/runtime/],
            defaultAttribute: 'defer',
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFileName: '[id].css',
        }),
        new PurgecssPlugin({
            paths: fg.sync(['./src/**/*'], {
                onlyFiles: true,
                absolute: true,
            }),
        }),
    );
}

module.exports = config;
