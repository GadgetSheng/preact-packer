"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doBuildAction = void 0;
var path = require('path');
var fs = require('fs');
var process = require('process');
var exec = require('child_process').exec;
var chalk = require('chalk');
var webpack = require('webpack');
var util = require('util');
var del = require('del');
var preactCfg = require('./webpack.config');
var writeFileP = util.promisify(fs.writeFile);
function checkEnv() {
    return new Promise(function (resolve, reject) {
        exec('npm list --depth=0', function (err, stdout, stderr) {
            var packageJSON = require(path.resolve(__dirname, '../package.json'));
            var requiredPackages = Object.keys(packageJSON.peerDependencies);
            var errorMsgs = [];
            requiredPackages.forEach(function (requiredPkg) {
                var reg = new RegExp("\\b" + requiredPkg + "@");
                if (reg.test(stderr)) {
                    errorMsgs.push(requiredPkg + " is not existed, please install " + requiredPkg + "@" + packageJSON.peerDependencies[requiredPkg]);
                }
            });
            if (errorMsgs.length > 0) {
                reject(new Error(errorMsgs.join('\n')));
            }
            resolve();
        });
    });
}
function getPackageJson(cwd) {
    if (cwd === void 0) { cwd = process.cwd(); }
    //运行时所在目录
    var pkgJSONPath = path.resolve(cwd, './package.json');
    var pkgJson = require(pkgJSONPath);
    return pkgJson;
}
function getMainPathFromPkgJson(cwd) {
    var pkgJson = getPackageJson(cwd);
    return pkgJson && pkgJson.main &&
        path.resolve(cwd, pkgJson.main);
}
function outputWebpackRet(err, stats) {
    if (err) {
        console.error(err.stack || err);
        if (err.details) {
            console.error(err.details);
        }
        return;
    }
    var info = stats.toJson();
    if (stats.hasErrors()) {
        var e = info.errors;
        console.error(e.toString());
        return;
    }
    if (stats.hasWarnings()) {
        console.warn(info.warnings);
    }
    console.log(stats.toString({
        chunks: false,
        colors: true // Shows colors in the console
    }));
}
function runWebpack(option, webpackOption) {
    return new Promise(function (resolve, reject) {
        var watch = webpackOption.watch;
        var compiler = webpack(option);
        if (watch) {
            compiler.watch({}, outputWebpackRet);
        }
        else {
            compiler.run(function (err, stats) {
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
function buildPreact(entryPath, webpackOption) {
    return __awaiter(this, void 0, void 0, function () {
        var preactEntryPath, option, webpackRet;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    preactEntryPath = path.resolve(process.cwd(), './tmpEntryFile.jsx');
                    return [4 /*yield*/, writeFileP(preactEntryPath, "\n        import React from 'react';\n        import { render } from 'react-dom';\n        import * as Components from " + JSON.stringify(entryPath) + ";\n        \n        export default function renderComp(dom, props, compName = 'default') {\n            if (!Components) {\n                throw new Error('components is not existed');\n            }\n\n            const Comp = Components[compName];\n\n            if (!Comp) {\n                throw new Error('components is not existed');\n            }\n\n            render(<Comp {...props} />, dom);\n        }\n    ")];
                case 1:
                    _a.sent();
                    option = Object.assign({}, preactCfg(webpackOption), { entry: preactEntryPath });
                    return [4 /*yield*/, runWebpack(option, webpackOption)];
                case 2:
                    webpackRet = _a.sent();
                    // delete the temporary file of the entry
                    return [4 /*yield*/, del([preactEntryPath])];
                case 3:
                    // delete the temporary file of the entry
                    _a.sent();
                    return [2 /*return*/, webpackRet];
            }
        });
    });
}
function doBuildAction(name, options) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1, cwd, entryFilePath, entryFileStats, preactOnly, reactOnly, webpackOption, bundleNames, preactRet, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, checkEnv()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error(chalk.red('you should install all peer dependencies for your packing environment'));
                    console.error(chalk.red('exec error', error_1));
                    return [2 /*return*/];
                case 3:
                    cwd = process.cwd();
                    if (name) {
                        entryFilePath = path.resolve(cwd, name);
                    }
                    else {
                        entryFilePath = getMainPathFromPkgJson(cwd);
                    }
                    if (entryFilePath) {
                        if (!fs.existsSync(entryFilePath)) {
                            console.error(chalk.red('Entry file is not existed'));
                            return [2 /*return*/];
                        }
                        entryFileStats = fs.statSync(entryFilePath);
                        if (!entryFileStats.isFile()) {
                            console.error(chalk.red('entry file is not existed or error type, please check the command or package.json'));
                            return [2 /*return*/];
                        }
                    }
                    preactOnly = options.preactOnly, reactOnly = options.reactOnly, webpackOption = __rest(options, ["preactOnly", "reactOnly"]);
                    bundleNames = [];
                    bundleNames.push('preact.bundle');
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 7, , 8]);
                    console.log(chalk.green("start build package for file of " + bundleNames.join(' and '), chalk.yellow(entryFilePath)));
                    preactRet = buildPreact(entryFilePath, webpackOption);
                    if (!preactRet) return [3 /*break*/, 6];
                    return [4 /*yield*/, preactRet];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    console.log(chalk.green('build package complete'));
                    return [3 /*break*/, 8];
                case 7:
                    e_1 = _a.sent();
                    if (e_1 instanceof Error) {
                        console.error(chalk.red('build package failed'), e_1);
                    }
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports.doBuildAction = doBuildAction;
