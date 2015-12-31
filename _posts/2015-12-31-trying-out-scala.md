---
layout: post
title:  "Trying out Scala for the first time"
date:   2015-12-31
tags: scala
---

I've looked into the the Scala programming language a bit. Here is a summary of
how to get started and what it offers.

Scala is interesting because it has full support for functional programming
while also being JVM-based with great Java interoperability (I'm not a huge fan
of the JVM but there is a lot of Java code out there). In particular, compared
to other functional languages, it seems to offer a more realistic migration path
from imperative programming in general (and from Java in particular). It allows
you to start out writing imperative code with mutable state and then you can
gradually opt-in to a more functional style with immutable data structures and
even laziness. This gradual opt-in process is very valuable if you want to
transition an existing team/codebase from Java to Scala while still shipping
code.

To try out small things quickly you can also just fire up a Scala REPL by
running ```scala``` with no command line parameters. You can also compile + run
a tiny program using ```scala main.scala``` (if there are no dependencies). To
print ```Hello World``` using Scala it's sufficient to create a file that reads:

```scala
println("Hello World")
```

However, usually you would define an object with a ```main()``` method like this
instead:

```scala
object MyProgram {
  def main(args: Array[String]): Unit = {
    println("Hello World")
  }
}
```

In earlier versions of Scala it was quite common with "procedure syntax", i.e.
```def f() { .... }``` instead of ```def f(): Unit = { .... }```, for functions
that doesn't return anything. Today IDEA, for example, rewrites procedure syntax
to the longer form automatically as you type. At first I didn't like that, I
thought procedure syntax looked cleaner. However, when I looked into it a bit
more it turns out that procedure syntax is deprecated for ```-Xfuture``` builds
because it led to a lot of bugs for newcomers.

# Building and testing Scala code

[SBT](https://en.wikipedia.org/wiki/SBT_(software)) seems to be the de facto
build tool within the Scala community, so I went with that (although Maven and Gradle
are both used as well, especially for Java + Scala projects). IDEA can import a
project from an external SBT model so builds inside and outside of the IDE are
using the same configuration. To setup SBT you create a build.sbt in the
root of your project. Here you can specify project metadata like for example
library dependencies (either in .jar files or more commonly as references to the
Maven central repository).

The syntax of build.sbt might look a bit weird at first (it's actually Scala code!),
especially if you're using the older <= 0.13.6 versions of SBT that requires
[every other line to be empty](http://stackoverflow.com/questions/21780787/why-does-sbt-version-%E2%89%A4-0-13-6-require-blank-lines-between-settings-in-sbt-fil).
Also, there is no Debian package for SBT which sucks a bit. Apparently, this is
because SBT uses SBT to build itself and Debian doesn't like circular dependencies.
True story.

Anyway, SBT allows you to run your application using ```sbt run```. If you have
multiple ```main()``` methods in a single project you can invoke a specific one
using ```sbt 'runMain SomeObjectName'```.

There are many options for unit testing, most prominently
[ScalaTest](http://www.scalatest.org/), [ScalaCheck](https://www.scalacheck.org/),
[specs2](https://etorreborre.github.io/specs2/) and [JUnit 4](http://junit.org/).
I didn't want to spend a lot of time evaluating different test frameworks, I just
wanted something that did basic expected vs actual assertions and integrated well
with SBT and IDEA. You run your tests by invoking ```sbt test``` and it can then
hand over control to any one of these test frameworks.

I decided to use regular JUnit 4 testcases written in Scala. To set that up,
I added a dependency in build.sbt on the "SBT <--> JUnit" bridge available
(available on Maven central) and while I had that file open I also enabled verbose
mode for the JUnit test runner so that it prints out the name of each testcase
it runs:

```scala
// junit-interface implements the sbt test interface and calls our JUnit
// test suite so that "sbt test" from the command line works.
libraryDependencies += "com.novocode" % "junit-interface" % "0.11" % "test"

// Tell Junit to print the name of each test during "sbt test":
testOptions += Tests.Argument(TestFrameworks.JUnit, "-v")
```

To write the actual testcase you just add a ```@Test``` annotation to your test
method and then use ```assertEquals(expected, actual)``` etc. I used a Scala
wildcard import (similar to static imports in Java) to bring all the assertions
into scope:

```scala
import org.junit.Test
import org.junit.Assert._

class MyTestClass {

  @Test
  def MyTestClass(): Unit = {
    assertEquals(2, 1 + 1)
  }

}
```

If you add ```@Test``` without writing out the import first IDEA might ask you
if you want to add an import for ```org.junit.Test``` or ```junit.framework.Test```.
The latter is used for JUnit 3 tests (the JUnit 4 .jar contains a copy of JUnit 3
to help people migrate). What I typically do is that I select "Exclude 'junit.framework'
from auto-import" and then IDEA will never ask about that again:

<img src="/assets/introduction-to-scala-exclude-from-auto-import.png">


To run the tests, launch ```sbt test``` (or if you prefer, right-click the test
class in IDEA and select 'Run MyTestClass' from the menu). You can also run a
specific testcase or run a specific subset of the tests, like this:

```
sbt 'test-only -- MyTestClass.MyTestClass'
sbt 'test-only -- *TestClass.verify*'
```

If you need to pass [parameters directly to the test framework](https://github.com/sbt/junit-interface)
you can do this after the ```--```, for example to disable color output
run ```sbt 'test-only -- -n'```. One last sbt command worth know is:

```
sbt console
```

It brings up a Scala REPL _with_ your project loaded. This is quite useful if you
just want to quickly verify something or experiment a bit. The thing I used the
REPL for most of the time was to understand exactly what the type of a some
expression was. Scala has static typing but also very powerful type inference
so sometimes, especially when you're new to the language, it's not entirely clear
if something is an iterator, a sequence or a list etc.

When it comes to downsides, SBT runs on the JVM so it starts slow and even
trivial commands like ```sbt help``` takes noticable time to run. One thing it
does really well though is incremental compilation which is built into SBT
itself. If you run ```sbt ~compile``` the compiler will continuously watch the
source tree and re-compile only the files you changed (as well as all the files
that depend on the files you changed). Same thing for ```sbt ~console```
although you have to press CTRL-d to trigger the recompile inside the REPL.

# First impressions of the Scala language

Now that we covered the grunt work of build and test infrastructure. I'd like to
mention a few of the really nice things that I discovered about Scala.

* You can use ```==``` to compare strings. Thank god!
* If you prefix your string literals with ```s```, then you can use string
interpolation to create really readable formats trings, e.g. you can do:

```scala
println(s"Hello, $name")
println(s"Your account has ${account.balance} USD")
println(s"The answer is ${41 + 1}")
```
* Really easy-to-use and readable anonymous functions (I really love these!):

```scala
scala> List(0, 0, 0, 1, 2).map(_ + 1)
res4: List[Int] = List(1, 1, 1, 2, 3)

scala> List(0, 0, 0, 1, 2).map(_ + 1).reduce(_ * _)
res5: Int = 6

scala> List("abc", "hello", "mo", "molsson", "omg").sortBy(_.length)
res1: List[java.lang.String] = List(mo, abc, omg, hello, molsson)
```

* Variables are immutable by default (you need to declare them with ```var```
instead of ```val``` if you need to change their values). Even the collection
classes in the Scala standard library are available in both mutable and
immutable variants. Of course, if you create a ```val myRef``` that points to
a mutable object, then the ```val``` means that ```myRef``` won't ever point to
another object, but it doesn't guarantee that the state inside the object it
points to remains the same:

```scala
val x = 42

var y = 1
y += 2

val lst = new scala.collection.mutable.ListBuffer[Int]()
lst.append(11)
```

* Classes can be quickly defined without a lot of boilerplate getter/setter code:

```scala
class MyClass(val immutableMember: String, var mutableMember: Int)

val myObj = new MyClass("first", 11)
myObj.mutableMember = 42
println(s"${myObj.immutableMember} ${myObj.mutableMember}")
```
