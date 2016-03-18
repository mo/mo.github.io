---
layout: post
title:  "Advent of Code 2015 using Scala"
date:   2016-01-09
tags: scala puzzles
---

During December I solved the programming "puzzle" [Advent of
Code](http://adventofcode.com/about). To make it a little bit more interesting I
decided to solve the problems using the [Scala programming language](http://www
.scala-lang.org/) which I had never used before. Learning a new programming
language is great fun by itself, but doing it with this kind of puzzle problems
is even more interesting because after you're done you can browse GitHub and see
how other people solved the exact same problem. Huge thanks to [Eric
Wastl](https://twitter.com/ericwastl) for creating Advent of Code, it was a lot
of fun! Below I'll comment on some of the problems and a few things I learned
along the way.

My solutions are available [here](https://github.com/mo/advent-of-code-2015/tree/master/scala).

# Day 1, 2 and 3

My initial solutions to problems 1, 2 and 3 smelled a bit too much of Java so
after I finished day 25 I went back and made them a bit more functional in style
and I simplied 1 and 3 by using ```scanLeft()```. I didn't know about this
function when I first did these problems; it takes a list and returns a new list
where the Nth element is an acculumation of a specified zero and the N first
elements of the original list. For example, if you feed it the natural numbers
along with the plus operator you get the triangular numbers back:

```scala
scala> List(1, 2, 3, 4, 5, 6, 7, 8, 9, 10).scanLeft(0)(_+_)
res1: List[Int] = List(0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55)
```

My solution to day 1 looked like this (day 2 and 3 was kind of variants of the same thing):

```scala
def findFloor(input: String): Int = {
  input.map {
    case '(' => 1
    case ')' => -1
  }.sum
}

def findBasementIndex(input: String): Int = {
  input.map {
    case '(' => 1
    case ')' => -1
  }.scanLeft(0)(_+_).indexOf(-1)
}
```

In Scala both the dot and the parenthesis in ```"abc".contains("b")``` is
optional so if you want you can do ```"abc" contains "b"```. It also goes
the other way; all operators in Scala are just regular methods so it's also legal
to invoke ```+``` like a method, i.e. ```1.+(2)```. I used this when I omitted
the parenthesis for ```map()``` above.

The block of code passed to ```map()``` is a special kind of anonymous function.
Normally when you do pattern matching in Scala you use ```someVariable match {
case BLAH => SOMETHING }``` but in my solution to day 1 there is ```case```
without any ```match``` keyword and it's used to defined a [partial
function](http://www.scala-
lang.org/api/current/index.html#scala.PartialFunction). A partial function is
defined only for the listed case values which can also be of different types
(conceptually these functions are similar to a [partial
function](https://en.wikipedia.org/wiki/Partial_function) in mathematics).

# Day 4

Day 4 involved a lot of MD5 hashing and it was the first problem that took some
time to compute the correct answer. I looked around for a simple Scala (or JVM)
profiler that I could use but didn't find anything that I liked. Instead I just
passed ```-Xprof``` to the JVM and that was enough to discover that beyond the
MD5 hashing itself my initial solution was spending a fair bit of time in byte
to hex conversion. I rewrote the code so that it converted to nibbles instead
of hex and more importantly I added ```hash(0) == 0 && ...``` (redundant but
very nice for performance) to the search criteria.

```scala
def calcAdventCoinNumber(zeros: Int, key: String) : Int = {
  require(zeros >= 2)
  Iterator.from(0).indexWhere {
     i =>
       val hash = md5(key + i)
       hash(0) == 0 && hash.slice(0, 1 + zeros / 2).flatMap {
         byte => Seq(byte >> 4, byte & 0xF)
       }.slice(0, zeros).forall(_ == 0)
  }
}
```

It still took several seconds to find the correct answer so I looked into using
all CPU cores as well. I looked at the multi core Scala solutions posted [here](
https://github.com/SuperTux88/adventofcode/blob/master/src/main/scala/adventofco
de/Day4.scala) and [here](https://github.com/jrohland/adventofcode-
scala/blob/master/src/Day04Part1.scala), but I thought it was harder to read
that code compared to my single core version and I wanted something less
intrusive. I read a bit about [Akka](http://akka.io/) (which I plan to learn
about anyway at some point) but it seemed overkill at the time. After a while I
found Scala's "parallel collections" but at first I could not get them to work
work well for infinite streams. Finally I found a really sweet little trick to
get around that; I grouped the infinite iterator and applied a parallel filter
to each finite group:

```scala
def calcAdventCoinNumber(zeros: Int, key: String) : Int = {
  require(zeros >= 2)
  val BATCH_SIZE = 20000
  Iterator.from(0).grouped(BATCH_SIZE).flatMap(_.par.filter {
    i =>
      val hash = md5(key + i)
      hash(0) == 0 && hash.slice(0, 1 + zeros / 2).flatMap {
        byte => Seq(byte >> 4, byte & 0xF)
      }.slice(0, zeros).forall(_ == 0)
  }).next()
}
```

I was quite happy when I finally found this trick!

Despite this being a ridiculously parallelizable problem, this multi core
version takes around 80% of what the single process version takes (I've tried
with lots of different group sizes and the multi core version is indeed using
all the CPU cores). However, if I run ```calcAdventCoinNumber()``` a few times
before I start to measure, then the multi core version takes just over 50% of
the single core version which is better but still sucks on a quad core machine.

I was wondering if the 80 vs 50 thing was due to the JIT actually taking some
time for compilation so I enabled ```-XX:+PrintCompilation``` and
```-verbose:gc```. The former doesn't say how much time the compilation is
taking but there is certainly a lot of it going on during measurement if I don't
do the warm up runs first. From what I can see, it looks like almost 2 full
seconds is drained by this "compilation or something". I think it sounds like a
lot, but on the other hand it also prints a lot of method names that it is
compiling, e.g. stuff in collection classes and the MD5 code etc.

Running with those parameters didn't give me the answers that I wanted so I
googled around a bit more for profiling tools. I found that there is a GUI
profiler called VisualVM included in the JDK itself so I decided to give that
a try. For Debian, it's packaged separately so you need to install the
```visualvm``` package. Then I just did a [quick hack](https://github.com/mo/advent-of-code-2015/commit/7df38ce9d4f90f5e25c68a9d15f9453a8ff9be5f) in SBT to build Day 4 as a
fat jar that I could run outside of SBT. This is what that looked like:

<img src="/assets/advent-of-code-day04-visualvm.png">

Of course what I want is for MD5 to be in the top of the self time column.
Instead, ```ForkJoinPool.scan()``` and ```ForkJoinPool.idle()``` has the top
spots. I still don't really understand what's going on there.

# Day 5

This one was also cleaned up a bit after looking at other peoples solutions. My
favorite thing was the discovery that the ```apply()``` method on ```Set()```
makes it possible to pass a set directly to ```count()``` or ```exists()```.

```scala
def isNicePart1(s: String): Boolean = {
  val vowels = "aeiou".toSet
  val forbidden = Set("ab", "cd", "pq", "xy")
  def hasDuplicate(st: String) = """(.)\1""".r.findFirstIn(st).isDefined

  s.count(vowels) >= 3 && hasDuplicate(s) && !s.sliding(2).exists(forbidden)
}

def hasDuplicatePair(s: String) = """(\w)(\w).*\1\2""".r.findFirstIn(s).isDefined
def hasXYX(s: String) = s.sliding(3).exists(ss => ss.length == 3 && ss(0) == ss(2))

def isNicePart2(str: String): Boolean = {
  hasDuplicatePair(str) && hasXYX(str)
}

val strings = DataFolder.openFile("day05.txt").getLines().toList

val niceStringsSeenPart1 = strings.count(isNicePart1)
val niceStringsSeenPart2 = strings.count(isNicePart2)
```

# Day 6

My solution to this one could really use some tlc but I never got around to it
(it looks like poor Java code brutally translated to Scala syntax). I was really
hoping for an easter egg if the light array was saved to disk as a bitmap, but
for my data all I got was this:

<img src="/assets/advent-of-code-day06.png">

# Day 7

One common bug that I saw when looking at other peoples solution for day 7 was
that they store the wire signals as integers but forget to do ```& 0xFFFF``` on
the NOT gate output. My input data happened to have an even number of NOT gates
so I would have gotten the correct answer even if I also had this bug which is
probably what happened for these people. The LSHIFT gate has the same issue. The
following testcases catches those kinds of bugs:

```
32769 -> a
a LSHIFT 1 -> b
# assert that b is 2

1 -> a
NOT a -> b
# assert that b is 65534
```

# Day 8

I get more than enough of string escaping at work. Fortunately, the problems was
easy.

# Day 9

Longest path problems can be tricky but this graph was ridiculously small so I
took the easy way out:

```scala
def calcShortestLongestPath(distancesSpec: String): (Int, Int) = {
  val distanceSpecPattern = """(\w+) to (\w+) = (\d+)""".r
  val distanceSpecLines = distancesSpec.split("\n").map(_.trim)
  val locations = distanceSpecLines.map {
    case distanceSpecPattern(from, to, distance) => List(from, to)
  }.reduce(_++_).distinct
  val distanceMap = distanceSpecLines.map {
    case distanceSpecPattern(from, to, distance) =>
      List(((from, to), distance.toInt), ((to, from), distance.toInt))
  }.reduce(_++_).toMap
  def routeDistance(locationList: List[String]): Int = {
    locationList.sliding(2).map {
      case Seq(from, to) => distanceMap((from, to))
    }.sum
  }
  val allPathLengths = locations.permutations.toList.map(routeDistance)
  val shortestPath = allPathLengths.min
  val longestPath = allPathLengths.max
  (shortestPath, longestPath)
}
```

One neat thing I used here is that Scala actually has a built-in function for
generating permutations on a regular ```List``` objects (and a similar method
for generating combinations as well!). And since strings are essentially lists
of chars you can do:

```scala
scala> List(1, 2, 2).permutations.toList
res1: List[List[Int]] = List(List(1, 2, 2), List(2, 1, 2), List(2, 2, 1))

scala> "abb".permutations.toList
res9: List[String] = List(abb, bab, bba)

scala> "abc".combinations(2).toList
res14: List[String] = List(ab, ac, bc)

scala> "abc".combinations(2).toList
res14: List[String] = List(ab, ac, bc)

scala> "abb".combinations(2).toList
res15: List[String] = List(ab, bb)
```

This is really nice to have when doing puzzles!

# Day 10

With regex backtracking and Scala [Look and Say](https://en.wikipedia.org/wiki/Look-and-say_sequence) stepping got surprisingly easy:

```scala
def lookAndSay(str: String) = {
  """([[0-9]])\1*""".r.findAllIn(str).map {
    run => run.length.toString + run(0)
  }.mkString
}
```

# Day 11-18

More of the same mostly.

One nice thing I learned while writing testcases for day 18 was that when you
paste multiline strings into IDEA it automatically inserts pipe characters as
prefix on each line and also inserts a call to .stripMargin() that removes them
at runtime. This is super useful because it means you can intent/align your
multiline strings nicely in the code without inserting crap into the actual
strings. A nice collaboration between programming language and IDE; I wish more
languages/tools had this feature:

```scala
    assertEquals("""|..##..
                    |..##.#
                    |...##.
                    |......
                    |#.....
                    |#.##..""".stripMargin, getLightStatusString())
```

# Day 19

At first this was was taking a lot of CPU time without producing a result.
Eventually I cheated and looked at a solution a friend had on GitHub. He had
used the same naive/bruteforce approach as me, but he also had a
```random.shuffle(replacements)``` which apparently made his solution work. WTF?
When I saw that I was thinking to myself; there is no way I'm going to accept
such a hacky solution. Then I spent a few hours trying to come up with a cleaner
solution, failed and then I put in the random as well and moved on with my life.

I would love to see a solution to this problem that performs well and works for
the general case (i.e. doesn't use knowledge of the particular input data). On
the reddit solutions thread someone mentioned that it could be treated as a
generic parsing problem, which to me sounded like to most promising solution.

# Day 20-23

More of the same.

# Day 24

This was my favorite problem! I wrote a recursive function that
generates fixed length [restricted integer compositions](https://en.wikipedia.org/wiki/Composition_(combinatorics)).

```scala
def restrictedCompositions(number: Long, termCount: Long,
                           terms: List[Long]): List[List[Long]] = {
  require(number >= 0)
  require(termCount >= 1)
  require(terms.forall(_ >= 0))
  if (termCount == 1) {
    terms.filter(_ == number).map(_ => List(number))
  } else {
    terms.filter(_ <= number).zipWithIndex.flatMap { case (term, idx) =>
      val remaining = terms.slice(0, idx) ++ terms.slice(idx + 1, terms.length)
      restrictedCompositions(number - term, termCount - 1, remaining).map {
        resComp => List(term) ++ resComp
      }
    }
  }
}
```

Once I had that in place it was easy to look for the ideal package configuration:

```scala
def calcIdealConfigQE(weights: List[Long], compartmentCount: Long): Long = {
  val weightSum = weights.sum
  require(weightSum % compartmentCount == 0)
  val groupSize = weightSum / compartmentCount

  Iterator.from(1).foreach { pcPackages =>
    val cfgs = restrictedCompositions(groupSize, pcPackages, weights.sortBy(-1*_))
    if (cfgs.nonEmpty) {
      return cfgs.sortBy(_.product).head.product
    }
  }
  -1
}
```

# Day 25

Originally I wrote a loop that calculated each code in turn. This was quite fast
and worked well, but when I looked at how other people had solved this one I found
one guy who had done ```modPow``` on ```BigInt``` so I tried doing that as well
and it turned out that doing so was over 1000 times faster than my original loop
so I kept it:

```scala
def calcIndexFromRowAndColumn(row: Long, column: Long): Long = {
  val completeDiagonals = row + column - 2
  column + completeDiagonals * (completeDiagonals + 1) / 2
}

def calcCodeForRowAndColumn(row: Long, column: Long): Long = {
  20151125 * BigInt(252533).modPow(
    calcIndexFromRowAndColumn(row, column) - 1,
    33554393).toLong % 33554393
}
```

# Conclusion

Scala is a great language for doing puzzles, and a really really expressive
language in general. Sometimes I was amazed at how much stuff I could say with
just one or a few lines of Scala code.

Also, Advent of code was really fun, I hope they make another one for next year!

