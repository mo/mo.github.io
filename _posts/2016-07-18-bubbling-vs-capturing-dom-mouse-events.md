---
layout: post
title:  "Capturing vs bubbling for DOM mouse events"
date:   2016-07-18
tags: web
---

As long as you take it with a grain of salt, Stack overflow is great site for
finding answers to questions about programming. However, every now and then you
run into some particular topic where SO is just completed swamped with really
bad advice and incorrect answers. While working on some JS chart framework code,
I needed to do distinguish between "mouse dragging" and "clicking", so I googled
a bit to see [how people solve that](http://lmgtfy.com/?q=javascript+distinguish+drag+vs+click).

Delivery of DOM events is one of those things that tons of people just don't
get. There seems to be massive confusion around bubbling and capturing events,
and lot of people don't understand ```ev.stopPropagation()``` versus
```ev.preventDefault()``` either. This API is quite bad for historical reasons,
and a few changes in browser behavior over time has not made the situation
better.

After browsing these threads for a while, I was really not sure what to believe
so I wrote the little snippet below that shows the delivery order of DOM mouse
events:

```html
<style>
#div1, #div2, #div3 {
    padding: 5px;
    margin: 25px;
}
#div1 { background: #AAAAAA; }
#div2 { background: #CCCCCC; }
#div3 { background: #EEEEEE; }
</style>

<div id="div1">div1
    <div id="div2">div2
        <div id="div3">div3
        </div>
    </div>
</div>

<script>
const mouseEventTypes = ["mousedown", "mouseup", "click"];

const printEvent = (direction, ev) => {
    console.log(`${ev.type} ${direction} ${ev.currentTarget.id}`);
};
const printBubbling = ev => printEvent("bubbling", ev);
const printCapturing = ev => printEvent("capturing", ev);

function addMouseEventListeners(elem) {
    mouseEventTypes.forEach(eventType => {
        elem.addEventListener(eventType, printCapturing, true);
        elem.addEventListener(eventType, printBubbling, false);
    });
}

addMouseEventListeners(document.querySelector("#div1"));
addMouseEventListeners(document.querySelector("#div2"));
addMouseEventListeners(document.querySelector("#div3"));
</script>
```

Clicking the outermost div1, the console prints:

```
mousedown capturing div1
mousedown bubbling div1
mouseup capturing div1
mouseup bubbling div1
click capturing div1
click bubbling div1
```

Clicking the innermost div3, the console prints:

```
mousedown capturing div1
mousedown capturing div2
mousedown capturing div3
mousedown bubbling div3
mousedown bubbling div2
mousedown bubbling div1
mouseup capturing div1
mouseup capturing div2
mouseup capturing div3
mouseup bubbling div3
mouseup bubbling div2
mouseup bubbling div1
click capturing div1
click capturing div2
click capturing div3
click bubbling div3
click bubbling div2
click bubbling div1
```

Quirksmode has a really comprehensive [writeup](http://www.quirksmode.org/js/events_order.html) on this subject as well.
