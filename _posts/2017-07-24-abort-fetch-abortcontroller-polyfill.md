---
layout: post
title:  "AbortController polyfill for cancelling fetch()"
date:   2017-07-24
tags:   javascript web
---

While writing tests for a React app I ran into the following warning:

```
Warning: setState(...): Can only update a mounted or mounting component. This usually
means you called setState() on an unmounted component. This is a no-op. Please check
the code for the BoatyMcBoatface component.
```

This warning is emitted, for example, when a component starts a REST call (or timer etc) and then
gets unmounted before the call completes. Once the call does complete, it typically tries to do
setState() on the component, which is not legal after it has been unmounted.

So the correct fix is to abort the REST call when the component unmounts, which is easy if you're
using axios or some other ```XMLHttpRequest``` wrapper. The problem was that I was using native
```fetch()``` which doesn't have support for aborting the request (yet). I googled around for the
status on cancellation and it turns out that just a few days ago a new API was been
added<sup>[1](#footnote1)</sup> to the DOM specification for this. This new API is a smaller scope
compared to cancellation of promises for which discussions stalled a bit early this year.

This [new DOM API](https://dom.spec.whatwg.org/#aborting-ongoing-activities) allows you to create an
```AbortController``` that in turn allows you to pass an ```AbortSignal``` into the ```fetch()```
call. Later on you can call ```.abort()``` on the controller to cancel the request. If you used the
new API from a React application, it would look like this:

```js
componentDidMount() {
  this.controller = new AbortController();
  const signal = this.controller.signal;
  fetch(`/api/thing?id=${this.props.thingId}`, {signal}).then(res => {
    if (res.status == 400) {
      this.setState({ loading: false, actualThing: undefined });
      return;
    }
    return res.json();
  }).then(actualThing => {
    this.setState({ loading: false, actualThing });
  }).catch(err => {
    if (err.name == 'AbortError') {
      return;
    }
    // It's important to rethrow all other errors so you don't silence them!
    // For example, any error thrown by setState(), will pass through here.
    throw err;
  });
}

componentWillUnmount() {
  this.controller.abort();
}
```

I wanted to try this new API in my application, so I created a polyfill for it. The polyfill does
not actually close the TCP connection on abort, it just throws the ```AbortError``` as seen above
and then when the response arrives it is dropped silently (the real implementation will close the
TCP socket though of course). This allows you to target the new API today and once the API is
implemented in browsers you can just drop the polyfill and not modify your code. The polyfill is
available here:

* [abortcontroller-polyfill on NPM](https://www.npmjs.com/package/abortcontroller-polyfill)
* [mo/abortcontroller-polyfill on GitHub](https://github.com/mo/abortcontroller-polyfill)

If you're using webpack, you simply ```npm install --save abortcontroller-polyfill``` and then
```import 'abortcontroller-polyfill';``` or ```require('abortcontroller-polyfill');``` near the top
of your client entrypoint .js or just include ```'abortcontroller-polyfill'``` as an entrypoint
itself (before your own entrypoint).

When I was googling around for the status on cancellation, I also noticed that Ron Buckton is
presenting a very ambitious [proposal](https://github.com/tc39/proposal-cancellation#readme)
([slides](https://tc39.github.io/proposal-cancellation/CancellationPrimitives-tc39.pptx)) at a [TC39
meeting](https://github.com/tc39/agendas/blob/master/2017/07.md) (which happens to be today!) that
aims to unify cancellation, not just for DOM but for asynchronous functions, asynchronous iterators,
webworkers, animation etc in such a way that they can be both synchronous and asynchronously
observed (i.e. asking "was it cancelled?" verus "tell me if it cancels"). This work is based on
cancellation in managed threads in the .NET Framework.

<p class="footnote"><a name="footnote1">1</a>: The final version of <a
href="https://dom.spec.whatwg.org/#aborting-ongoing-activities">AbortController</a> has been added
to the DOM specification. The corresponding <a href="https://github.com/whatwg/fetch/pull/523">PR
for the fetch specification</a> is essentially done but not technically merged yet, waiting for
testcases to be merged into web-platform-tests via <a
href="https://github.com/w3c/web-platform-tests/pull/6484">PR #6484</a>. Browser bugs tracking the implementation of AbortController is available here: Firefox: <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1378342">#1378342</a>, Chromium: <a href="https://bugs.chromium.org/p/chromium/issues/detail?id=750599">#750599</a>, WebKit: <a href="https://bugs.webkit.org/show_bug.cgi?id=174980">#174980</a>, Edge: <a href="https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/13009916/">#13009916</a>.

</p>
