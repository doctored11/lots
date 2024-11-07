const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');


const webpack = require('webpack');

const dotenv = require('dotenv');
dotenv.config()

const NODE_ENV = process.env.NODE_ENV;
const IS_DEV = NODE_ENV == 'development';


module.exports = {
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
    },
    mode: NODE_ENV ? NODE_ENV : 'development',
    entry: path.resolve(__dirname, './src/index.tsx'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        publicPath: '/'

    },
    module: {
        rules: [
            {
                test: /\.[tj]sx?$/,
                use: ['ts-loader'],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            publicPath: './',
                            outputPath: 'src/',
                            name: '[name].[ext]',
                        },
                    },
                ],
            },
            {
                test: /\.module\.css$/,
                use: ['style-loader', {
                    loader: 'css-loader',
                    options: {
                        modules: {
                            mode: 'local',
                            localIdentName: '[name]__[local]--[hash:base64:5]',
                        },
                    },
                }],
            },
            {
                test: /\.css$/,
                exclude: /\.module\.css$/,
                use: ['style-loader', 'css-loader'],
            },

        ]
    },
    plugins: [
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, 'public/index.html')
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/source', to: 'source' },
            ],
        }),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env),
        })
        
    ],
    devServer: {
        static: path.join(__dirname, 'dist'),
        compress: true,
        port: 3003,
        open: true,
        hot: IS_DEV,
        historyApiFallback: true,
    }

};