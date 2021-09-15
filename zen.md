# 这是一个cli项目

zen.md 表示创建过程的操作目录

## 创建cli项目的主要步骤

1. package.json 中要有 bin 对象->并指定命令名称与入口文件
2. bin中指定的文件首行需要声明`#!/usr/bin/env node`
   告诉系统用 node 运行这个文件。
3. 安装依赖-最主要的这个库 `commander`
4. 由于typescript开发
   1. 需要增加-D 依赖 typescript,@types/inquirer
   2. 配置tsconfig.js `tsc --init`,修改为.js,`module.exports={}`
   3. **target=es6**,**module=esnext**
   4. **sourceMap=false**,**declaration=false**
   5. **outDir=./dist**,removeComments=false
   6. 外层增加**include=src**
