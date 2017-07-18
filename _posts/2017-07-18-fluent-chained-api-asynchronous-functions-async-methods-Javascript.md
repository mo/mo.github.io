---
layout: post
title:  "Chained APIs for asynchronous functions in Javascript"
date:   2017-07-18
tags:   javascript web
---

Quite a few of the web application E2E test frameworks implemented in Javascript have APIs based on
method chaining that sort of hide the asynchronous nature of Selenium testing (send command to
browser, wait for reply, send command, wait for reply etc). Examples include NightwatchJS, wd.js
when it is being used via its chained Q-promises API and also Cypress. Variants of this chaining is
sometimes referred to as [Fluent Interface](https://en.wikipedia.org/wiki/Fluent_interface).

For example, here is a NightwatchJS testcase:

```js
browser
  .url('http://launchpad.kp/')
  .click('#big-red-button')
  .waitForElementVisible('.confirmation-popup', 1000)
  .assert.containsText('.confirmation-popup', 'fire ze missiles?')
  .click('#cancel-button')
  .end();
```

These chained APIs make asynchronous code look sort of synchronous even though it's not. Often
people can get by without knowing how it works, until for example they have to step through the code
in a debugger; then it really helps a lot to understand how these APIs are built.

# Why chained async methods can be unintuitive at first

If you break the chain into two parts and add some breakpoints:

```js
browser
  .url('http://launchpad.kp/')
  .click('#big-red-button')
  .waitForElementVisible('.confirmation-popup', 1000)

debugger;

browser
  .assert.containsText('.confirmation-popup', 'fire ze missiles?')
  .click('#cancel-button')
  .end();

debugger;
```

When the debugger stops at the first breakpoint, nothing has happened yet. The browser hasn't
received the URL yet, in fact, Nightwatch hasn't even started the browser yet. However, the same is
also true at the second breakpoint. This is because the code doesn't really perform the actions,
instead it just builds a "list of actions", the first of which the Javascript engine will begin to
execute at the next runslice. Technically, this list is stored as a chain of promises.

Actually, there are also non-chaining variants of this where seemingly synchronous code just chains
up promises that gets executed later on. For example, early versions of the npm package
```selenium-webdriver``` (the "official" Javascript bindings for Webdriver shipped by the Selenium
project themselves) had a [global promise
manager](https://github.com/SeleniumHQ/selenium/wiki/WebDriverJs) that allowed you to write code
like this:

```js
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

driver.get('http://www.google.com/ncr');
driver.findElement(By.name('q')).sendKeys('webdriver');
driver.findElement(By.name('btnG')).click();
driver.wait(until.titleIs('webdriver - Google Search'), 1000);
driver.quit();
console.log('program finished');
```

But just like the "debugger" breakpoints in the nightwatch example, this snippet would first run to
completion (and print ```program finished```) and then after that it would start the actual testing.

Even though I think a more attractive approach (on Node) is proper coroutines via ```node-fiber```,
I still think it's quite interesting to understand what different approaches have been tried,
including chaining APIs. And in browsers we only have chaining APIs and async/await to pick from; so
in extreme cases like E2E testing maybe chaining is the cleaner option instead of writing await on
every API call (for example, Cypress executes E2E tests from the browser itself and uses chaining).

# How to implement a chained API with async methods

When you implement a chaining API for synchronous functions, you just put all the functions on an
object and you make sure that each function first does its thing and then returns ```this```.
Notably the thing that the function "does" can be either A) something that modifies state on
```this```, or B) something that creates a copy of ```this``` where the state is slightly different
(we don't have to return ```this```, we are only required to return something that implements all
the methods in our API so that the chaining can continue).

For example, in jQuery you might do:

```js
const elem = $('<div>')
  .text('hello')
  .css('color', 'blue')
  .addClass('foo');
```

When the above API chain is evaluated the element accumulates the text, the CSS and the class.

To implement chaining for asynchronous functions, we do the exact same thing, but the "state" we
keep inside ```this``` is the chain of promises. We keep appending to this chain of promises as we
evaluate the chain in the API.

To implement such a chained API in vanilla JS, one could do:

```js
function someAsyncFunc(cb) {
  console.log('someAsyncFunc() called')
  setTimeout(() => cb(), 100);
}

function otherAsyncFunc(cb) {
  console.log('otherAsyncFunc() called')
  setTimeout(() => cb('otherAsyncFunc() result'), 100);
}

const someFunc = () => new Promise(resolve => someAsyncFunc(resolve))
const otherFunc = () => new Promise(resolve => otherAsyncFunc(resolve))

const MyApi = (previousActions = Promise.resolve()) => {
  return {
    someFunc: () => MyApi(previousActions.then(someFunc)),
    otherFunc: (cb) => MyApi(previousActions.then(otherFunc).then(res => cb(res))),
  };
}

const api = MyApi();
exports.api = api;

console.log("before chain")
api
  .someFunc()
  .someFunc()
  .otherFunc(result => console.log(result))
  .someFunc()
  .otherFunc(result => console.log(result))
console.log("after chain")
```

If you run the above example, it outputs:

```js
before chain
after chain
someAsyncFunc() called
someAsyncFunc() called
otherAsyncFunc() called
otherAsyncFunc() result
someAsyncFunc() called
otherAsyncFunc() called
otherAsyncFunc() result
```
