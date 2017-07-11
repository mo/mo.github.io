---
layout: post
title:  "Javascript unit testing tools"
date:   2017-06-05
tags:   javascript web
---

I have compared<sup>[1](#footnote1)</sup> few different tools for unit testing Javascript code. The frameworks I looked into
were QUnit, Mocha JS, tape, AVA, Jasmine, Karma and Jest. I wrote a few testcases and then ported
these to each framework. The testcases I wrote were meant to detect defects in various kinds of
functions, for example:

* regular function that returned an incorrect value
* regular function that unexpectedly throws an error
* callback function that calls back immediately (same tick) and returns the wrong value
* asynchronous callback function that delivers the wrong value
* asynchronous callback function that forgets to callback
* asynchronous callback function that accidentally calls back twice
* asynchronous function returning a promise and resolving with an incorrect value
* asynchronous function returning a promise that is then unexpectedly rejected

Before we dig into the implementation of these test scenarios in each test framework, here is a
table summarizes a few basic facts:

|                                                     | QUnit  | Mocha   | tape  | AVA    | Jasmine | Karma   | Jest                                    |
| --------------------------------------------------- | ------ | ------- | ----- | ------ | ------- | ------- | --------------------------------------- |
| Total Commits                                       | 1,157  | 2,263   | 453   | 1,062  | 1,584   | 2,274   | 2,224                                   |
| GitHub Stars                                        | 3,630  | 12,480  | 3,889 | 10,335 | 12,502  | 8,623   | 10,455                                  |
| Issue Resolution Time <sup>[3](#footnote3)</sup>    | 3 days | 11 days | 1 day | 5 days | 7 days  | 58 days | 22 hours                                |
| Open Issues / All Issues <sup>[3](#footnote3)</sup> | 4%     | 17%     | 27%   | 17%    | 4%      | 20%     | 5%                                      |
| License                                             | MIT    | MIT     | MIT   | MIT    | MIT     | MIT     | BSD-3-Clause <sup>[4](#footnote4)</sup> |

If you plot the commit count of each project over time it's clear that QUnit and Jasmine are the
oldest projects, and also that there is a very large amount of commits landing in the Jest
repository right now (and have been for quite some time now) compared to all the other frameworks:

<img src="/assets/javascript-unit-testing-commit-count.png">

Another interesting thing to look at is the weekly download count on npm for each framework over
time; Mocha is the most commonly used framework by a very wide margin. And if we dig into recent
growth numbers (looking at from 2017-01-15 up until today) we see that Mocha weekly downloads
increased by 206K (up 19%) while for example Jest added 195K new weekly downloads in the same period (which for them was an impressive 145% increase in less than 5 months!):

<img src="/assets/javascript-unit-testing-weekly-npm-downloads.png">

Below are some things I noted while writing sample testcases using these frameworks.

# QUnit

The first framework that I looked at in-depth was QUnit. This is one of the oldest unit testing
frameworks for Javascript. It was originally developed to test jQuery and jQuery UI, but was later
extracted into a separate project that does not even depend on jQuery. Unfortunately while writing
my first few testcases for QUnit, I ran into a bug! If you have a testcase that calls a function
with an asynchronous callback, but the function forgets the invoke the callback; then QUnit
terminates with exit code 0 and doesn't even print the passed/failed summary. I bet many CI systems
would interpret that as a PASS, so it's a show stopper bug imo. The testcase illustrates the
problem:

```js
function asyncForgetCallback(str, callback) {
  if (isBuggy) {
    // accidentally nothing
  } else {
    setTimeout(() => callback(str.trim().toLowerCase()), 0);
  }
}

QUnit.only('util test async callback function that forgets to callback', assert => {
  const doneFunc = assert.async();
  util.asyncForgetCallback('   Foo   ', actual => {
    assert.equal(actual, 'foo');
    doneFunc();
  });
});
```

Later I found that this bug was discovered and filed on Github in March, but nobody has had time to
fix it yet: [#1132](https://github.com/qunitjs/qunit/issues/1132).
A workaround for the bug is to set a global default timeout using ```QUnit.config.testTimeout = 2000``` or similar.

On the plus side, QUnit was able to correctly handle the "accidental double callback" scenario (and
doing this also without me having to declare the expected number of assertions) by failing the
testcase due to assert + doneFunc being called after the original call to doneFunc(). It should be
noted that QUnit does offer an "expected assertion count" feature available though, useful for more
advanced test scenarios.

There was also some minor nitpicking issues that I noted while writing the rest of the testcases for
QUnit:

* Normally when you do ```assert.equal(actual, "expected")``` QUnit will print both the "actual" and
the "expected" value whenever the assertion fails. However, if "actual" happens to be ```undefined```
then only the expected value is printed. This is a minor issue, but I filed it as bug [#1177](https://github.com/qunitjs/qunit/issues/1177). The maintainer asked if I wanted to fix it
myself and I figured what the hell, so I [did](https://github.com/js-reporters/js-reporters/pull/102).

* In the QUnit documentation, the introduction starts with examples of ```assert.equal()```, but
note that the assertion ```assert.equal(1, "1")``` holds so (imo) it's much better to
use ```assert.strictEqual()``` by default and only resort to ```assert.equal()``` when you need it.
Imo it would be better if QUnit had a "default assertion" that checked for strict (===) equality.
This behavior comes with the default ```assert``` module in NodeJS (and also the "CommonJS Unit
Testing" specification), so you get the same thing for example in Mocha JS if you choose to use
those asserts there; but QUnit doesn't allow you to use any other type of assertions. Pretty much
all modern Javascript testing frameworks default to === and lets you opt-in for == when you need it.

* From a UX perspective, I don't like that QUnit prints its default TAP output as ```# fail 0```
with red color when all tests are passing, while it prints for example ```# fail 1``` as the summary
line when one testcase fails. Nothing on screen should be red when all tests are passing. You can
use an alternative reporter by passing ```--reporter``` but I like good defaults.

* Another UX issue is that npm packages ```qunit``` and ```qunitjs``` both install a binary called ```qunit``` but only the latter can be used to run tests using the method described in the
documentation. Confusing for newbies.

# Mocha JS

Mocha was started in 2011 by Tj Holowaychuk, the same guy that founded ExpressJS, co, commander.js,
koa and a bunch of other highly successful NodeJS projects, and who then [switched to
golang](https://medium.com/@tjholowaychuk/farewell-node-js-4ba9e7f3e52b) three years ago. After its
inception, the project quickly grew into a comprehensive test framework that covers a lot of
different testing needs, and a large number of people have contributed to its success over the years
(roughly 15 unique authors shows up in the git log each 60 day period). Lately though, the Mocha JS
project has been having some problems finding developers to keep up with maintenance, their GitHub
page current says "we're currently unable to merge most pull requests due to lack of maintenance
resources."

That said, this test framework is quite mature. It allows you to customize which type of assertions
you use and which test result reporter you use etc. There is also plugins for IDEs/editors like
emacs and IDEA and so on.

When I tried porting my testcases to Mocha JS I wasn't really satisfied with how it handled the
"accidental double callback". For example, if I did:

```js
// someCode.js
exports.asyncDoubleCallback = (str, callback) => {
  if (isBuggy) {
    setTimeout(() => callback(str.trim().toLowerCase()), 0);
    setTimeout(() => callback(str.trim().toLowerCase()), 0);
  } else {
    setTimeout(() => callback(str.trim().toLowerCase()), 0);
  }
};

// myTests.js
describe('#asyncDoubleCallback()', () => {
  // Mocha JS passes context object to it() via "this".
  it.only('is working', function (done) {
    util.asyncDoubleCallback('   Foo   ', actual => {
      assert.equal(actual, 'foo');
      done();
    });
  });
});
```

Then the default reporter (from Mocha 3.3.0) shows this result:

<img src="/assets/javascript-unit-testing-mocha-double-callback.png">

Note that Mocha does not report the number of passed/failed assertions, it reports the number of
passing and failing *testcases*. In the above example I'm running a single testcase
using ```it.only()```, but Mocha reports 1 testcase passed and 1 testcase failed?!

# tape

The tape GitHub page starts with testling-ci badge that hasn't run since 2014, proudly claiming to
support "Chrome 29". There also hasn't been a lot of commits made in the tape git repository lately.
It was slightly annoying having to ```t.end()``` or ```t.plan()``` all testcases. Also I didn't like
that tape aborts the entire test suite if a single testcase throws, but it was easy to "fix" by
switching the ```require('tape')``` to ```require('tape-catch')``` instead.

Here is how tape handles the accidental double callback bug scenario btw:

<img src="/assets/javascript-unit-testing-tape-double-callback.png">

Note that tape, unlike Mocha, prints the number of assert passes/fails in the summary so everything
is technically correct here in some sense.

*Update 2017-07-11: As mentioned by Stefan Alexander Meng in the comments below; there is also a
test framework called [node-tap](http://www.node-tap.org/) which is similar to tape in a lot of
ways but with a few key issues fixed. If you like tape you should also have a look at node-tap
before you decide which framework to use.*

# AVA

AVA describes itself as "futuristic" and unlike the other frameworks it runs tests in parallel,
supports (and promotes) testing using ES2017 (and even post-ES2017 features like Observables).
It also has extremely good assertion output, much better than the previous test frameworks. For
equality of strings and deep equality of objects it shows diffs to highlight the difference between
actual and expected. When my buggy callback function delivers the wrong value causing
a ```t.is(actual, 'foo')``` assertion to fail, then it immediately highlights the source line where
that bad value came from:

<img src="/assets/javascript-unit-testing-ava-async-callback-with-wrong-value.png">

While porting my testcases to AVA, I did hit one bug (filed as [#1377](https://github.com/avajs/ava/issues/1377)) in AVA related to timeouts (for the test
scenario where a function forgets to call its callback).

# Jasmine

Jasmine is a very old framework (first commit is from 2008). It was influenced to some extent by
Ruby "RSpec". Offers test doubles using spies built-in (in other frameworks you need to import
something like [```sinon.js```](http://sinonjs.org/)).

When I ported over the testcases to Jasmine, I found that, unlike the four previous test frameworks,
it happily reports PASS in the "accidental double callback" scenario even if ```done()``` is called
twice:

```js
describe('#asyncDoubleCallback() naive', () => {
  it('is working', function (done) {
    util.asyncDoubleCallback('   Foo   ', actual => {
      expect(actual).toEqual('foo');
      done();
    });
  });
});
```
Jasmine also does not offer any assertion planning feature. At some point in 2014, somebody opened a GitHub issue ([#626](https://github.com/jasmine/jasmine/issues/626)) asking for this to be added but
the issue was closed by the maintainers because "they've not heard about this request before" which
is unfortunate. They offer call counting for test double spies with callThrough, but using those for
this scenario would be cumbersome and inefficient.

# Karma

Karma is not a test framework per se, but rather a test runner that can take a test suite written in
Mocha, QUnit or Jasmine and then run that suite in parallel on multiple browsers (desktop or
mobile, and also including JSDom, PhantomJS and headless Chrome). All browsers report back results
that are then presented as terminal output. It can also watch your test directory and automatically
rerun the tests each time you update a testcase. Karma is the test runner used by Angular JS and was
developed by the Angular team at Google. If you want to run your tests in browsers, then you should
probably be using Karma regardless of which of the frameworks you pick (except for Jest, more on
that below).

# Jest

Jest is the test framework and test runner that is used by the React project and consequently by
many libraries, tools and web apps implemented using React. The fact that it's used by and backed by
Facebook lends it both credibility and likely resources. Among the top 10 contributors to Jest,
everyone except two works at Facebook. It seems like a large part of the work is done by Chris Pojer
tbh.

Jest started as a test runner wrapped around Jasmine, and the assertions still looks
like ```expect(foo).toBe('bar')```, but now there are few traces of Jasmine left. Jest doesn't have
support for running tests inside a real browser, cpojer shared some thoughts around this
[here](https://github.com/facebook/jest/issues/139#issuecomment-229277654) and in issue
[#848](https://github.com/facebook/jest/issues/848). One really cool feature of Jest is snapshot
testing, which helps you detect regressions in your output (either React component trees serialized to text, or for example an AST serialized to text if you're working on a source transformation tool).

When I tried to port my testcases to Jest, I quickly ran into a Jest bug where assertion failures
inside callbacks were suppressed (I was left with a test that timed out for no apparent reason and I
had to do some digging before I even found the suppressed errors). I originally filed this as [#3519](https://github.com/facebook/jest/issues/3519) but it turned out to be a duplicate of
[#2059](https://github.com/facebook/jest/issues/2059).
If your async code uses promises instead of callbacks, this issue won't affect you. If it's
possible, a nice way to escape the problem is simply to refactor to your old callback based
functions to use promises instead. However, if you absolutely need to test functions with callbacks
(e.g. maybe you just inherited a big legacy code base and you want to write testcases before you
refactor, or maybe the callback API is used by third-party code) then the status quo for Jest seems
to be that for any assertion inside an asynchronous callback you have to wrap the
assert inside a try/catch that explicitly calls fail instead (like they do in lerna unit tests  [here](https://github.com/lerna/lerna/commit/8c3f2df6da71cb17454cf94647ca00990927d18a)). Another
workaround would be to temporarily wrap the callback in a promise inside the testcase:
```js
test('testedFunc calls its callback with the correct value', async () => {
  expect.assertions(1);
  const actual = await new Promise(resolve => testedFunc('some input', resolve));
  expect(actual).toBe('foo');
});
```

As seen in the commit count chart earlier, there seems to be a lot of momentum behind Jest right
now. This is also reflected if you plot the number of active developers in each project (i.e. for
every date X, the Y-value is defined as the number of unique e-mails seen in git log from X - 365 days up until X). That plot looks like this:

<img src="/assets/javascript-unit-testing-jest-active-dev-count.png">

The number of developers involved in Jest increasing very quickly, they must be doing a lot things
right when it comes to community building. I also looked at "the number of people which more than
50 commits" for each framework and Jest comes out highest there too with seven such developers so
this is not all "one-off drive-by patching" either.

# Conclusion

I was surprised that I hit so many little bugs / issues when trying to use these testing frameworks.
Maybe the best choice is to do like TJ and switch to Go? :-P Staying with Javascript, I think
it's hard to ignore the momentum behind Jest. I would be awesome if someone fixed [#2059](https://github.com/facebook/jest/issues/2059) though. Then again, Mocha seems to work well
enough for a lot of people.

<br><br>

<p class="footnote"><a name="footnote1">1</a>:
<a href="https://en.wikipedia.org/wiki/Analysis_paralysis">https://en.wikipedia.org/wiki/Analysis_paralysis</a>.
</p>

<p class="footnote"><a name="footnote2">2</a>:
Technically, wtgtybhertgeghgtwtg is anonymous but "their contribution history smells like they work for Facebook" and amasad has left Facebook.
</p>

<p class="footnote"><a name="footnote3">3</a>:
The median "Issue Resolution Time" and the fraction of open issues among all issues, are both computed using the
excellent service <a href="https://isitmaintained.com/">Is it maintained?</a>.
</p>

<p class="footnote"><a name="footnote4">4</a>:
Contributors need to sign a Contributor License Agreement (CLA) before patches are merged into Jest,
and along with the BSD-3-Clause there is a patent grant which can be revoked by Facebook under
some circumstances, see details on
<a href="https://en.m.wikipedia.org/wiki/React_(JavaScript_library)#Licensing">Wikipedia</a>.
</p>
