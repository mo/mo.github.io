---
layout: post
title:  "Solving the 2x2x2 Rubik's Cube"
date:   2016-05-11
tags: puzzles
---

First off, if you don't have a 2x2x2 cube yet and you want one; I recommend
a <a href="http://amzn.to/1ZG7SDR">MoYu TangPo</a>.

In this blog post I'm going to describe an easy method for solving the 2x2x2
Rubik's cube. While this post might seem long at first, it's really just two
quick sequences of moves to learn plus a handful of situations to recognize. The
2x2x2 Rubik's cube (also called the Pocket cube) is slightly easier than the
regular 3x3x3 Rubik's cube. A few of the tricks that are needed to solve the
2x2x2 can also be used when solving the 3x3x3 (or the
[Pyramorphix](https://en.wikipedia.org/wiki/Pyramorphix) puzzle).

Given enough time, most people work out how to turn a single side into the same
color. The thing that makes these 3D combination puzzles difficult is that if
you want to preserve what you already completed/arranged you have less and less
freedom to move pieces around. The fix for that problem is to apply sequences of
moves (often referred to as "algorithms") that will make some kind of change in
the "still unsolved" part of the cube while at the same time making no changes
to the "solved part" of the cube.

To describe the steps in each algorithm I will use standard Rubik's cube
notation (also called [Singmaster
notation](https://en.wikipedia.org/wiki/Rubik%27s_Cube#Move_notation)).
Basically each of the 6 sides are named by a single letter; F is the front side
(facing you), L is the left side, R is the right side, B is the back (facing
away from you), U is up and D is down. An algoritm is a series of moves and each
move is either a clockwise or a counter-clockwise rotation of a single side. If
```X``` is an arbitrary side, then the clockwise rotation (one quarter) of that
side is denoted ```X``` and the counter-clockwise move of that side is denoted
```X'```. So ```U``` means turn the upper side clockwise one step and ```R'```
means turn the right side counter-clockwise one step. A full algorithm could be
for example ```D' R' D R```. Sometimes ```U2``` is used to denote ```U U```.
Finally, a specific corner piece can be denoted by a non-ordered combination of
three letters, e.g. the upper right corner on the ```F``` layer can be referred
to as ```FUR``` (or ```RUF``` etc).

The 2x2x2 solution I will describe here uses two such sequences of moves, both
of which can be used (along with a few other tricks) to solve a 3x3x3 cube as
well. In addition to knowing these sequences of moves, you also have to be able
to recognize what state the cube is in and you have to know how to orient the
cube before performing the sequence of moves.

Let's begin by noting the difference between "solving a side" and "solving a
layer". The cube one the left has a solved layer and the cube on the right has a
solved side:

<img src="/assets/rubiks-cube-2x2x2-side-vs-layer.jpg">

The first step in solving 2x2x2 is to solve the first layer. Most tutorials on
the internet start out by solving white first, so when you're solving the cube
for the first time it's helpful if you do that as well. Solving the first layer
is pretty easy so you can probably do it by playing around with it a bit without
following any specific steps. The general idea is to keep the solved white
pieces in the top layer and then dip down to pick up additional pieces as
necessary from the lower layer. For exampe, in the cubes below you could do ```D
L D' L'``` and ```D' R' D R``` to complete the white sides:

<img src="/assets/rubiks-cube-2x2x2-left-right-elevators.jpg">

If you get a white piece facing downwards, just put it underneath where it's
supposed to be, then dip that side down (```R``` or ```L```, whichever side
contains the downward facing white), then rotate the lower layer one step, and
undo the dip again. Instead of a white piece facing downwards, you will now have
a white piece facing sideways in the lower rotation (in the ```D``` layer), and
you can then rotate the ```D``` layer until that white piece is facing you while
still being just below where it is supposed to go (like in the 2 cases above).

Once you have solved the first (white) layer, then place the cube up side down
and get ready to solve the yellow side (we'll do the "yellow side" first and
then convert the "yellow side" into a solved "yellow layer" later). White/yellow
are opposite on most cubes, as are blue/green and red/orange. Though, if you
find a corner piece that has both white and yellow you have a non-standard color
scheme, and then you need to work out what the opposite of white should be by
studying the corner pieces.

Solving the first (white) layer means that no yellow pieces are left in that
layer, and this in turn means that there are yellow somewhere on each of the
non-layer-1 pieces (sometimes one the side, sometimes up top). This next step
will reorient all the yellow pieces, creating a complete yellow side (not a
layer). The sequence of moves we'll use to do this is sometimes referred to as
an "OLL algorithm" (OLL = Orient Last Layer). There are several different
algorithms one can use for this.

In general, you can learn to recognize a lot of different cube states along with
a corresponding algorithm for each one. The more different kinds of states you
can recognize, the fewer moves you need in total to solve the cube. The cube has
a total of ```8!*3^7/24 = 3674160``` [possible
states](https://en.wikipedia.org/wiki/Pocket_Cube#Permutations), so in reality
what you're looking for is manageable classes of such states. People who compete
in "speedcubing" tend to get faster by learning to recognize more states and
memorizing more algorithms. Some algorithms are easier to perform on a
mechanical level than other (and right handed people might prefer other
algorithms compared to left handed people for instance), and some algorithms are
easier to memorize etc.

Below I have listed all 8 possible configurations of yellow squares that are
seen when the solved white layer is turned downwards (of course each state can
be turned in 4 different ways though). No other configuration of yellow squares
is possible as long as the white layer is solved:

{% include captioned-image.html
           img="/assets/rubiks-cube-2x2x2-state1-duck.png"
           caption="State 1: Duck"
           width="180px" %}

{% include captioned-image.html
           img="/assets/rubiks-cube-2x2x2-state2-headlights.png"
           caption="State 2: Headlights"
           width="180px" %}

{% include captioned-image.html
           img="/assets/rubiks-cube-2x2x2-state3-arrow.png"
           caption="State 3: Arrow"
           width="180px" %}

{% include captioned-image.html
           img="/assets/rubiks-cube-2x2x2-state4-tank.png"
           caption="State 4: Tank"
           width="180px" %}

{% include captioned-image.html
           img="/assets/rubiks-cube-2x2x2-state5-tractor.png"
           caption="State 5: Tractor"
           width="180px" %}

{% include captioned-image.html
           img="/assets/rubiks-cube-2x2x2-state6-cw-thrusters.png"
           caption="State 6: CW Thrusters"
           width="180px" %}

{% include captioned-image.html
           img="/assets/rubiks-cube-2x2x2-state7-ccw-thrusters.png"
           caption="State 7: CCW Thrusters"
           width="180px" %}

{% include captioned-image.html
           img="/assets/rubiks-cube-2x2x2-state8-solved.png"
           caption="State 8: Solved"
           width="180px" %}

The goal of the OLL step that we'll do now is to get from states 1-7 onto state
8. The particular algorithm that we will use in this guide is called the Sune
and it goes ```R U R' U R U2 R'```. The nice thing about the Sune algorithm is
that it changes the configuration of yellow pieces while keeping the already
white layer intact. The net effect of Sune on a cube is that for each piece in
the ```U``` layer, except for ```LUF```, it will "rotate the three colors on
that corner piece clockwise one step". Though, it's really not necessary to
think about how each individual color will move within each corner piece,
instead you can just see which of these states you're in and then hold the cube
so that the U side looks exactly like one of the cases above. And then apply the
Sune algorithm.

It's usually necessary to apply this algorithm several times (while holding the
cube in a particular way depending on what state you're in) to fully orient the
last layer. The Sune algorithm is probably the most common algorithm to learn,
it's often featured in beginner guides. There is also another variant of it,
called the Anti-Sune but we'll stick to just the regular Sune in this guide. The
algorithm was named Sune by [Lars
Petrus](https://en.wikipedia.org/wiki/Lars_Petrus) who used it, along with two
other algorithms (Niklas and Allan), in the "Lars Petrus System" which is a more
advanced/quicker way to solve the 3x3x3 Rubik's cube.

For example, if you have state 3 (arrow) and you perform the Sune algorithm you
will end up with state 4 (tank). All the states transitions look like this (each
arrow represents one invokation of the Sune algorithm):

<img src="/assets/rubiks-cube-2x2x2-state-transitions.svg" style="display: block; margin: 0 auto">

It's important that the U layer is oriented exactly like shown in states 1-7 so
sometimes the cube must be turned between two Sune invokations. For example, if
you have state 7 (CCW Thrusters) configuration but you hold it tilted 90 degrees
to the right like this:

<img src="/assets/rubiks-cube-2x2x2-ccw-thrusters-tilted-right.png" style="display: block; margin: 0 auto">

...then doing the Sune will bring you back to state 2 (Headlights) which is
...undesirable.

The cubes below is showing you state 2 (Headlights) and state 7 (CCW Thrusters):

<img src="/assets/rubiks-cube-2x2x2-orient-last-layer.jpg">

When you arrive at state 8 (yellow side solved), you are done with the OLL step.
Time for the PLL (Permute Last Layer) step where you go from a solved yellow
side to a solved yellow layer. Now you'll find yourself in one of three
situations:

* Situtation #1: When solving the yellow side you migt have also ended up
solving the yellow layer. If this is the case, then you can now rotate the
yellow layer until the other sides align with the solved white layer and the
entire cube will be solved.

* Situation #2: On one of side of the yellow layer the colors are the same but
on the other three sides of the yellow layer there are 2 different colors (see
the leftmost cube in the image below). This happens when two non-diagonally
adjacent yellow pieces have switched places. In this case, the two yellow pieces
that have the same side-color are the ones that are already correctly placed.
What remains to solve the cube in this situation is to switches places on the
two incorrectly placed yellow pieces.

* Situation #3: All the sides of the yellow layer has pairs of two different
colors on them (the rightmost cube in the image below illustrates this case).
This happens when two yellow pieces have switched places diagonally across the
yellow layer.

<img src="/assets/rubiks-cube-2x2x2-permute-last-layer-cases.jpg">

To solve the cube in situation #2 we need to find those two adjacent pieces on
the side of the yellow layer that has the same color, rotate the yellow ```U```
layer until there is a whole side with that color, then we orient the whole cube
so that this solved side is ```R``` (you should now have solved white on the
```D``` side, solved yellow on the ```U``` side and another solved side with
some color on ```R```. Then we do a single ```U'``` rotation, and after that we
perform the algorithm ```L' U R' D2 R U' R' D2 R2```. This algorithm is often
referred to as an ```Aa``` permutation. What it does is that it rotates the
positions of all corner pieces in the ```U``` layer, except for ```LUF```. This
means that ```RUF``` moves to ```LUB```, ```LUB``` moves to ```RUB``` and
```RUB``` moves to ```RUF```. When you just rotate the yellow layer the order of
the pieces in that layer obviously does not change, but the fact that ```LUF```
stays put during the ```Aa``` permutation means that ```RUF``` gets to move
ahead of ```LUF``` in the order. So another way to look at it is to say that
this algorithm sort of switches positions on the ```LUF``` and ```RUF``` corner
pieces within the order that they appear in the ```U``` layer. This is why we
are holding the two pieces with the same color on the side of the yellow layer
away from us; the order of these pieces are already correct.

Finally, to solve situation #3 where two of the yellow pieces have been swapped
diagonally we use the same algorithm as in step #2 but we can hold the cube in
any direction as long as we have the yellow side upwards. In this case the
```Aa``` permutation will take us to situation #2 (so we'll need to repeat the
algorithm one more time to solve the cube).

I hope this was sufficiently detailed to actually get your cube solved! Happy cubing..
