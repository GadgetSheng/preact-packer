"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var path = require('path');
var fs = require('fs');
var cssnano = require('cssnano');
var BundleAnalyzer = require('webpack-bundle-analyzer');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
function getMode(webpackOption) {
    return webpackOption && webpackOption.debug ? 'development' : 'production';
}
function containsFile(directory, file) {
    var filePath = path.resolve(directory, file);
    return fs.existsSync(filePath);
}
function getPackageJson() {
    var cwd = process.cwd();
    var pkgJSONPath = path.resolve(cwd, './package.json');
    var pkgJson = require(pkgJSONPath);
    return pkgJson;
}
function getLibName(webpackOption) {
    if (webpackOption && webpackOption.libName) {
        return webpackOption.libName;
    }
    var pkgJson = getPackageJson();
    var libName = pkgJson.library;
    if (!libName) {
        libName = 'Comp';
    }
    return libName;
}
function getOutputConfig(webpackOption) {
    return {
        library: getLibName(webpackOption),
        path: path.resolve(process.cwd(), webpackOption.output || 'dist'),
        libraryTarget: 'umd',
        globalObject: 'this',
        libraryExport: 'default'
    };
}
function getAllLoaders(mode) {
    var configFilePath = path.resolve(process.cwd(), 'tsconfig.json');
    if (!fs.existsSync(configFilePath)) {
        configFilePath = path.resolve(__dirname, '../tsconfig.json');
    }
    var tsLoader = {
        test: /\.tsx?$/,
        use: [
            {
                loader: 'ts-loader',
                options: {
                    configFile: configFilePath,
                    context: process.cwd()
                }
            }
        ]
    };
    var cwd = process.cwd();
    var babelRoots = ['babel.config.js', 'babel.config.cjs', 'babel.config.mjs', 'babel.config.json'];
    var babelRCFile = ['.babelrc.json', '.babelrc'];
    var containsRootFile = babelRoots.some(function (fileName) { return containsFile(cwd, fileName); });
    var containsRCFile = babelRCFile.some(function (fileName) { return containsFile(cwd, fileName); });
    var rootMode = containsRootFile ? 'upward' : 'root';
    var babelrc = containsRCFile;
    var configFile;
    if (rootMode === 'root' && !babelrc) {
        configFile = path.resolve(__dirname, '../.babelrc.js');
    }
    console.log('use babel file by mode', {
        rootMode: rootMode,
        babelrc: babelrc,
        configFile: configFile
    });
    var babelLoader = {
        test: /\.(js|jsx)$/,
        use: [
            {
                loader: 'babel-loader',
                options: {
                    rootMode: rootMode,
                    babelrc: babelrc,
                    configFile: configFile
                }
            }
        ]
    };
    var isDevMode = mode === 'development';
    var cssLoaders = [
        MiniCssExtractPlugin.loader,
        'css-loader'
    ];
    var postCSSLoaderProcess = __spreadArray(__spreadArray([], cssLoaders, true), [
        {
            loader: 'postcss-loader',
            options: {
                postcssOptions: {
                    plugins: [
                        [
                            'autoprefixer',
                            {
                                sourceMap: isDevMode
                            }
                        ]
                    ]
                }
            }
        }
    ], false);
    var styleLoaders = [
        {
            test: /\.css$/,
            use: cssLoaders
        },
        {
            test: /\.s[c|a]ss$/,
            use: __spreadArray(__spreadArray([], postCSSLoaderProcess, true), [
                'sass-loader'
            ], false)
        },
        {
            test: /\.less/,
            use: __spreadArray(__spreadArray([], postCSSLoaderProcess, true), [
                'less-loader'
            ], false)
        }
    ];
    return __spreadArray([
        tsLoader,
        babelLoader
    ], styleLoaders, true);
}
function getAllPlugins(mode) {
    var plugins = [];
    if (mode === 'production') {
        plugins.push(new OptimizeCssAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: cssnano,
            cssProcessorOptions: {
                safe: true,
                autoprefixer: false,
                convertValues: false,
                minifySelectors: false,
                discardComments: {
                    removeAll: true
                },
                discardUnused: false,
                mergeIdents: false,
                reduceIdents: false
            },
            canPrint: true
        }));
    }
    return plugins;
}
function getPlugins(webpackOption) {
    var mode = getMode(webpackOption);
    var plugins = __spreadArray([
        new MiniCssExtractPlugin({
            filename: 'css/[name].preact.css'
        })
    ], getAllPlugins(mode), true);
    if (mode === 'production') {
        plugins.push(new BundleAnalyzer.BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: path.resolve(process.cwd(), './reports/preactReport.html')
        }));
    }
    return plugins;
}
function genConfig(webpackOption) {
    var exclude = webpackOption.exclude;
    var mode = getMode(webpackOption);
    var cfg = {
        mode: mode,
        output: Object.assign(getOutputConfig(webpackOption), {
            filename: (webpackOption.file || 'bundle') + ".preact.js"
        }),
        module: {
            rules: __spreadArray([], getAllLoaders(mode), true)
        },
        plugins: __spreadArray([], getPlugins(webpackOption), true),
        resolve: {
            extensions: ['.wasm', '.mjs', '.js', '.json', '.ts', '.tsx'],
            alias: {
                react: 'preact/compat',
                'react-dom/test-utils': 'preact/test-utils',
                'react-dom': 'preact/compat'
                // Must be below test-utils
            }
        }
    };
    if (exclude) {
        cfg.externals = [
            {
                react: 'umd react',
                'react-dom': 'umd react-dom'
            }
        ];
    }
    return cfg;
}
module.exports = genConfig;
