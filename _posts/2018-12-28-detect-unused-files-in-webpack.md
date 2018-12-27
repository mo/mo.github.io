---
layout: post
title:  Detecting unused files with webpack
date:   2018-12-28
tags:   programming javascript web quicktip
---

In a small (9 kloc) webapp I'm working on occasionally I typically use eslint
(or similar) to detect unused code and stylelint to find unused CSS. Having zero
issues reported is part of the automatic tests that I run on all code before
it's pushed to git. However, I just found a whole unused file in my project
which these linters did not warn me about. Luckily, I also found a good way to
detect unused files in my pre-push quality check script: the
[```unused-webpack-plugin```](https://github.com/MatthieuLemoine/unused-webpack-plugin) webpack plugin.

To use it, install ```unused-webpack-plugin``` as a dev dependency and then add
something like this to your webpack.prod.config.js:

```js
const UnusedWebpackPlugin = require('unused-webpack-plugin')

module.exports = {
  ... ,
  plugins: [

    new UnusedWebpackPlugin({
      directories: [path.join(__dirname, 'src/client')],
      exclude: ['*.test.js'],
      root: __dirname,
      failOnUnused: true,
    })
```