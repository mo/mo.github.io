---
layout: post
title:  "Same-Origin Policy, CSRF and Cross-Origin Resource Sharing (CORS)"
date:   2017-02-20
tags:   web
---

The same-origin policy is one of the cornerstones in the web application
security model. It allows Javascript running in a webpage to access data inside
an iframe (or another browser window that it opened) only if the URL loaded in
that iframe/window is part of the same origin. Strictly speaking, an "origin" in
this context is defined as the triple of scheme/protocol, hostname and port number.
If all three are the same among two URIs; then those two URIs belong to the same
origin.

If Javascript was able to access data inside an iframe from another origin, then
a malicious webpage could just load www.some-social-network.com in an iframe
and then reach into the DOM of that iframe to steal the session cookie, using:

```js
document.querySelector("#theIFrame").contentDocument.cookie
```
This also assumes that the cookie wasn't marked with the HttpOnly flag, of course.
Even if all cookies were HttpOnly, it would still be unacceptable that a malicious
site could load your Internet-bank page in an iframe and then read out your
account balance, VISA-card number etc from the iframe DOM (assuming said
Internet-bank had a liberal "Keep me logged in" feature). The same origin policy
is the security mechanism that prevents the above by making sure that the iframe
DOM can only be accessed if the iframe URL points to the same origin as the
parent page.

The same origin policy also imposes limits on the ```fetch()``` (or
```XMLHttpRequest```) operations when they target an URL on another origin; for
these cases the browser will make the HTTP request but it will not give the
response data back to the Javascript that triggered the operation.

If you think this sounds odd, think about how to browser works outside of XHR.
For example, when the HTML at foo.com loads an image from bar.com, the browser
automatically attaches any bar.com cookies to the request. This means that if an
attacker can trick a victim into viewing HTML that the attacker wrote, then
regardless of what origin hosts that HTML code, the attacker will be able to do
authenticated HTTP GET requests using the victims credentials. The same is true
for HTTP POST requests because HTML forms can be created and submitted by
Javascript, and cookies are automatically attached to such cross-origin POST
requests as well. This type of attack is called Cross-Site Request Forgery (CSRF).

The above alone (without involving XHR) is already a huge problem, which takes a
lot of effort to guard against (using CSRF tokens etc). However, it would be
even worse if XHR did the same thing _and_ also provided access to the response
text because then we would be back to the iframe case in the beginning: the
attacker could write HTML that loaded your-internet-bank.com using XHR and then
read the account balance and VISA-card number etc from the response text. While
XHR and fetch does not automatically attach cookies, the attacker can simply set
```myReq.withCredentials = true;``` on the XHR before submitting it, or
equivalently pass ```{ credentials: 'include' }``` in the init options parameter
to ```fetch()```. So for all intents are purposes, any third party can make
authenticated (in the cookie-only sense) XHR requests to your website whenever
one of your customers visits the third-party website; but the browser will
prevent them from reading the response.

This type of same origin checks (i.e. not allowing the XHR response to be read
when the XHR is cross-origin, but allowing the response to be read if the XHR
does target the same origin) have to be done in every part of the web platform.
For example, imagine a system administration dashboard running at foo.com that
has a dynamically generated image (generated server-side) that shows the
physical location of all their users as dots on a map. Now, assume that an
attacker tricks the system administrator into opening funny-cats.com/evil.html
and that this page:

* creates an IMG element with src set to foo.com/user-dashboard.png (the browser will make an HTTP GET request for this image and it will include the regular dashboard session cookie proving that the user is currently logged-in)
* creates an HTML5 canvas and draws the IMG element onto it using .drawImage()
* calls toDataURL() on the canvas to convert its pixel data into string representation ```imgData```
* makes an XHR call to funny-cats.com/exfil.php?stolenData=imgData so that the user location data can be stored on the attacker server

The reason why the above doesn't work is because whenever a cross-origin image
is drawn into a canvas, the browser marks that canvas as "tainted", and whenever
you call toDataURL() on a tainted canvas, it will throw a security exception.
Corresponding mechanisms exists in many other parts of the browser, for example
the CSS Object Model (CSSOM) that allows Javascript to read CSS rules
programmatically (Houdini CSS even lets you access the unparsed CSS to make CSS
polyfills possible and at that point the data might as well be HTML). The bottom
line is that Javascript must not be able to read data coming from another
origin.

Ironically, in the real world, it happens very often that web developers must do
exactly the above, namely to read data from another origin and have access to
the data in Javascript. It might be because their webapp is so large that it
spans multiple domains, or it might be as simple as wanting to use XHR to call
third party APIs. Before 2009, there was no good way to do this, so instead
people had to resort to workarounds like for example proxying the XHR through
server-side on the same-origin alternatively this little hack called JSONP. The
latter takes advantage of the fact that Javascript files is loaded cross-origin
with cookies automatically attached to the request, so you can use them to
return data if you instead of returning ```{ ... json data here ... }```, simply
return something like ```foo = { ... json data here ... }```. Any website can
then do:

```js
<script src="https://whatever.com/jsonp-data.js"></script>
<script>console.log(foo)</script>
```

Of course asking everybody to execute untrusted thirdparty Javascript to be able
to get the data is undesirable. Also, evil.com can also put the above code on
their site and instead of ```console.log(foo)``` they might have an XHR that
stores the ```foo``` data on their server-side. Once they have set that up they
can just trick customers from whatever.com to visit evil.com, thus giving the
attack access to the ```foo``` data. So basically all data loaded via jsonp (or
any SCRIPT element for that matter) can be read by anyone on the Internet unless
CSRF protection is put in place.

It should be noted that users who have ticked the "Block third-party cookies"
checkbox in their browser settings cannot be phished using this type of basic
CSRF attack, because in this configuration the browser will not automatically
attach cookies to cross-origin requests. Another hugely important feature that
helps here is [SameSite=strict cookies](https://tools.ietf.org/html/draft-west-first-party-cookies-07), support for which is available in Chrome but unfortunately not Firefox or Edge yet (see [caniuse](http://caniuse.com/#feat=same-site-cookie-attribute)).

Because of the many security pitfalls around JSONP, a new specification for
cross-origin requests was created; namely Cross-origin Resource Sharing (CORS).
Thinking around such a specification started as early as 2005, but it wasn't
until 2009 (when Firefox 3.5 came out) that it was implemented anywhere and it
took until 2013 before the other browsers (IE) had fully implemented the new
spec (including the tainted canvas parts etc). It become a W3C recommendation in
2014.

The idea behind CORS is that when you need to load data from another origin,
instead of using a SCRIPT elment to load data in Javascript/JSONP format, you
use a regular XHR/fetch call but you modify the server-side so that it attaches
a "Access-Control-Allow-Origin" (ACAO) header in the reply that describes which origins
are allowed to make cross-origin requests. The browser will then return the
response to the Javascript code that triggered the XHR/fetch, only if the origin
was listed in the Access-Control-Allow-Origin header. Similar headers exists that
allows you to opt-in to cross-origin XHR only for specific HTTP verbs etc.

So basically CORS is a way for a web-based API to declare which websites that
are allowed to make cross-origin calls to it. Of course, these restricts only
apply for Javascript running inside a web browser, anyone can still curl the
API or make calls to it from Python or whatever. If what you're after is the
opposite, namely to control which servers/services that your web application may
talk to, then Content Security Policy is what you need instead.

Finally, WebSockets are always allowed to connect cross-origin while
simultaneously allowing Javascript to access the data they return, but they
always send an Origin: header when they connect so that the server can reject
connections from undesired origins. Having the security check on the server-side
is simple and elegant, and it works this way because websockets is a
comparatively modern standard. CORS is also fairly modern, but there the
security check is done client-side largely for compatibility reasons.
