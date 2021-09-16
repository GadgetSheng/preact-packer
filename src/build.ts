const path = require('path');
const fs = require('fs');
const process = require('process');
const { exec } = require('child_process');
const chalk = require('chalk');
const webpack = require('webpack');
const util = require('util');
const del = require('del');
const preactCfg = require('./webpack.config');
const writeFileP = util.promisify(fs.writeFile);

function checkEnv(): Promise<void> {
    return new Promise((resolve, reject) => {
        exec('npm list --depth=0', (err: any, stdout: any, stderr: any) => {
            const packageJSON = require(path.resolve(__dirname, '../package.json'));
            const requiredPackages = Object.keys(packageJSON.peerDependencies);
            const errorMsgs: Array<any> = [];

            requiredPackages.forEach((requiredPkg) => {
                const reg = new RegExp(`\\b${requiredPkg}@`);
                if (reg.test(stderr)) {
                    errorMsgs.push(`${requiredPkg} is not existed, please install ${requiredPkg}@${packageJSON.peerDependencies[requiredPkg]}`);
                }
            });

            if (errorMsgs.length > 0) {
                reject(new Error(errorMsgs.join('\n')));
            }
            resolve();
        });
    });
}

function getPackageJson(cwd: string = process.cwd()) {
    //运行时所在目录
    const pkgJSONPath = path.resolve(cwd, './package.json');
    const pkgJson = require(pkgJSONPath);
    return pkgJson;
}

function getMainPathFromPkgJson(cwd: string): string {
    const pkgJson = getPackageJson(cwd);
    return pkgJson && pkgJson.main &&
        path.resolve(cwd, pkgJson.main);
}

function outputWebpackRet(err: any, stats: any) {
    if (err) {
        console.error(err.stack || err);
        if (err.details) {
            console.error(err.details);
        }
        return;
    }
    const info = stats.toJson();
    if (stats.hasErrors()) {
        const e = info.errors;
        console.error(e.toString());
        return;
    }
    if (stats.hasWarnings()) {
        console.warn(info.warnings);
    }
    console.log(stats.toString({
        chunks: false, // Makes the build much quieter
        colors: true // Shows colors in the console
    }));
}


function runWebpack(option: any, webpackOption: any) {
    return new Promise((resolve, reject) => {
        const { watch } = webpackOption;
        const compiler = webpack(option);
        if (watch) {
            compiler.watch({}, outputWebpackRet);
        } else {
            compiler.run((err: any, stats: any) => {
                outputWebpackRet(err, stats);
                if (err || stats.hasErrors()) {
                    reject(err || stats.toJson().errors);
                    return;
                }
                resolve(stats);
            });
        }
    });
}

async function buildPreact(entryPath: string, webpackOption: {}) {
    const preactEntryPath = path.resolve(process.cwd(), './tmpEntryFile.jsx');
    await writeFileP(preactEntryPath, `
        import React from 'react';
        import { render } from 'react-dom';
        import * as Components from ${JSON.stringify(entryPath)};
        
        export default function renderComp(dom, props, compName = 'default') {
            if (!Components) {
                throw new Error('components is not existed');
            }

            const Comp = Components[compName];

            if (!Comp) {
                throw new Error('components is not existed');
            }

            render(<Comp {...props} />, dom);
        }
    `);
    const option = Object.assign({}, preactCfg(webpackOption), { entry: preactEntryPath });
    const webpackRet = await runWebpack(option, webpackOption);
    // delete the temporary file of the entry
    await del([preactEntryPath]);
    return webpackRet;
}

async function doBuildAction(name: string, options: any): Promise<void> {
    // console.log(chalk.cyan(`options ${JSON.stringify(name)}, ${JSON.stringify(options)} `));
    try {
        await checkEnv();
    } catch (error) {
        console.error(chalk.red('you should install all peer dependencies for your packing environment'));
        console.error(chalk.red('exec error', error));
        return;
    }
    const cwd: string = process.cwd();
    let entryFilePath: string;

    if (name) {
        entryFilePath = path.resolve(cwd, name);
    } else {
        entryFilePath = getMainPathFromPkgJson(cwd);
    }

    if (entryFilePath) {
        if (!fs.existsSync(entryFilePath)) {
            console.error(chalk.red('Entry file is not existed'));
            return;
        }

        const entryFileStats = fs.statSync(entryFilePath);
        if (!entryFileStats.isFile()) {
            console.error(chalk.red('entry file is not existed or error type, please check the command or package.json'));
            return;
        }
    }

    const { preactOnly, reactOnly, ...webpackOption } = options;
    const bundleNames = [];
    bundleNames.push('preact.bundle');

    try {
        console.log(chalk.green(`start build package for file of ${bundleNames.join(' and ')}`, chalk.yellow(entryFilePath)));
        let preactRet = buildPreact(entryFilePath, webpackOption);
        if (preactRet) {
            await preactRet;
        }
        console.log(chalk.green('build package complete'));
    } catch (e) {
        if (e instanceof Error) {
            console.error(chalk.red('build package failed'), e);
        }
    }
}

export {
    doBuildAction
}