const path = require('path');
const fs = require('fs');
const cssnano = require('cssnano');
const BundleAnalyzer = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

function getMode(webpackOption: any) {
    return webpackOption && webpackOption.debug ? 'development' : 'production';
}

function containsFile(directory: string, file: string) {
    const filePath = path.resolve(directory, file);
    return fs.existsSync(filePath);
}

function getPackageJson() {
    const cwd = process.cwd();
    const pkgJSONPath = path.resolve(cwd, './package.json');
    const pkgJson = require(pkgJSONPath);
    return pkgJson;
}

function getLibName(webpackOption: any) {
    if (webpackOption && webpackOption.libName) {
        return webpackOption.libName;
    }

    const pkgJson = getPackageJson();
    let libName = pkgJson.library;

    if (!libName) {
        libName = 'Comp';
    }

    return libName;
}

function getOutputConfig(webpackOption: any) {
    return {
        library: getLibName(webpackOption),
        path: path.resolve(process.cwd(), webpackOption.output || 'dist'),
        libraryTarget: 'umd',
        globalObject: 'this',
        libraryExport: 'default'
    };
}

function getAllLoaders(mode: string) {
    let configFilePath = path.resolve(process.cwd(), 'tsconfig.json');
    if (!fs.existsSync(configFilePath)) {
        configFilePath = path.resolve(__dirname, '../tsconfig.json');
    }

    const tsLoader = {
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
    const cwd = process.cwd();
    const babelRoots = ['babel.config.js', 'babel.config.cjs', 'babel.config.mjs', 'babel.config.json'];
    const babelRCFile = ['.babelrc.json', '.babelrc'];
    const containsRootFile = babelRoots.some(fileName => containsFile(cwd, fileName));
    const containsRCFile = babelRCFile.some(fileName => containsFile(cwd, fileName));

    const rootMode = containsRootFile ? 'upward' : 'root';
    const babelrc = containsRCFile;
    let configFile;

    if (rootMode === 'root' && !babelrc) {
        configFile = path.resolve(__dirname, '../.babelrc.js');
    }

    console.log('use babel file by mode', {
        rootMode,
        babelrc,
        configFile
    });

    const babelLoader = {
        test: /\.(js|jsx)$/,
        use: [
            {
                loader: 'babel-loader',
                options: {
                    rootMode,
                    babelrc,
                    configFile
                }
            }
        ]
    };
    const isDevMode = mode === 'development';

    const cssLoaders = [
        MiniCssExtractPlugin.loader,
        'css-loader'
    ];

    const postCSSLoaderProcess = [
        ...cssLoaders,
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
    ];

    const styleLoaders = [
        {
            test: /\.css$/,
            use: cssLoaders
        },
        {
            test: /\.s[c|a]ss$/,
            use: [
                ...postCSSLoaderProcess,
                'sass-loader'
            ]
        },
        {
            test: /\.less/,
            use: [
                ...postCSSLoaderProcess,
                'less-loader'
            ]
        }
    ];
    return [
        tsLoader,
        babelLoader,
        ...styleLoaders
    ];
}

function getAllPlugins(mode: string) {
    const plugins = [];

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

function getPlugins(webpackOption: any) {
    const mode = getMode(webpackOption);
    const plugins = [
        new MiniCssExtractPlugin({
            filename: 'css/[name].preact.css'
        }),
        ...getAllPlugins(mode)
    ];
    if (mode === 'production') {
        plugins.push(new BundleAnalyzer.BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: path.resolve(process.cwd(), './reports/preactReport.html')
        }));
    }

    return plugins;
}

function genConfig(webpackOption: any) {
    const { excludePreact } = webpackOption;
    const mode = getMode(webpackOption);
    const cfg: any = {
        mode,
        output: Object.assign(getOutputConfig(webpackOption), {
            filename: `${webpackOption.file || 'bundle'}.preact.js`
        }),
        module: {
            rules: [
                ...getAllLoaders(mode)
            ]
        },
        plugins: [
            ...getPlugins(webpackOption)
        ],
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

    if (excludePreact) {
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