---
layout: post
title:  "Functional Programming Principles in Scala"
date:   2016-07-20
tags:   scala
---

I recently finished the "Functional Programming Principles in Scala" online
course that Martin Odersky teaches via Coursera. The course gives an
introduction to Scala syntax while at the same time introducing functional
programming basics like recursive algorithms using accumulators and building
linked lists from cons cells. A lot of the examples and exercises comes from
[SICP](https://en.wikipedia.org/wiki/Structure_and_Interpretation_of_Computer_Progr
ams) but they are done in Scala instead of Scheme. This blog post is just a
writeup of some notes from this course.

Throughout the course, when Odersky introduces new syntax, he often also
explains how that construct could be rewritten or expressed using lower level
language features. For example, an anonymous function expressed using ```(x:
Int) => x * x``` can be rewritten as:

```scala
{
    class AnonFunc extends Function1[Int, Int] {
        def apply(x: Int): Int = x * x
    }
    new AnonFunc
}
```

This type of rewrites makes it easier to reason about the language because the
problem is reduced to studying a subset. Compared to for example C or Go, Scala
is a much larger language and it also has higher level language constructs, so
it can be hard to understand of how the various language constructs interact
with each other. Also, for better or worse, Scala has not been as conservative
about adding language features over the years, and you got a few examples where
language contructs that ought to be orthogonal cannot be used
together at all<sup>[1](#footnote1)</sup>.

One of the main benefits of functional programming is that it is easier to
reason about the code, both for the programmer as well as for the compiler. In
particular, you can evaluate expressions involving pure functions (functions
with no side effects) by using a substitution model based on lambda calculus.
While not covered in this particular course; Odersky et al have actually been
working for several years on identifying a very small subset of language
constructs that can be used as the foundation of the Scala language (to formally
prove type soundness and so on). It is called [DOT calculus](http://www.scala-
lang.org/blog/2016/02/03/essence-of-scala.html) and Odersky talked about it in
his [keynote at Scala Days](https://www.youtube.com/watch?v=_2oGY8l67jk) earlier
this year.

In most imperative languages you have "call by value" and in some, like C++ and
C#, you can use "call by reference" as well. In Scala you have a third
evaluation strategy named "call by name". When calling a method with a "call by
name" parameter, an "expression" is passed rather than the value it evaluates
to. It is then up to the called method to evaluate this expression 0, 1 or more
times. Microsoft .NET offers a similar capability with its ```Expression<T>```
type, but call by name has a long history; it was even used in ALGOL
60<sup>[2](#footnote2)</sup>.

In Scala, if you declare ```def myMethod(a: Int, b: => Int): Int = ...``` the
parameter ```a``` is a regular "call by value" parameter while ```b``` uses
"call by name". This means that for a call like ```myFunc(f(), g())``` you
cannot tell from looking at the callsite alone whether ```g``` will run once or
multiple times or maybe not run at all. Ultimately, to know whether ```g()```
from above will actually execute the function ```g```, one would have to read
the implementation of ```myFunc``` (or in some cases dig even further, i.e. if
the "call by name" parameter is passed into another function via another "call
by name" parameter). This requirement of non-local source knowledge to
understand a particular line of code is analogous to how the syntax used for C++
references make code hard to read:

```c++
#include <cstdio>

void func(int a, int& b) {
    b = a;
}

int main() {
    int x = 1, y = 0;
    func(x, y);
    printf("%d %d\n", x, y);
    return 0;
}
```

In the example above, you cannot know whether ```func(x, y)``` modifies the
variables ```x``` and ```y``` until you have read the implementation of
```func```. Some C++ developers use ```int* b``` instead just because that
forces ```&y``` at the call site (which is a cue to the reader that ```y```
might be modified), but pointers are unsafe, they can be ```NULL``` and come
with aliasing issues. C# offers a really nice solution to this problem, there
the compiler forces the programmer to write ```func(x, ref y)``` at the call
site if ```y``` can be modified (and it even offers the variant ```func(x, out
y)``` for out-only parameters). Maybe Scala's call by name syntax could be made
less icky by adding such a callsite cue as well? i.e. if it forced you to write
```myFunc(f(), => g())``` (or something like that) if the second param of myFync
was call by name?

Leaving that aside, call by name is a pretty neat feature to have because it
allows you to implement lazy data structures such as streams, which in turn are
important for making functional programs with decent performance. The ability to
opt into (or more importantly, to opt out of) laziness makes Scala much better
equipped to interoperate with existing imperative codebases.

In Scala, infix operators are really just another way of calling regular methods
so for example ```a + b == a.+(b)```. This, coupled with "call by name"
parameters, means that you can effectively implement an binary operator **with
short-circuit evaluation** as a regular method call! There are some special
cases though, for example the assignment operator is actually reserved word in
Scala. Anyway, with call by name you could even implement support for while
loops using a single tail recursive function, like this:

```scala
@tailrec
def myWhile(condition: => Boolean)(body: => Unit): Unit =
  if (condition) {
    body
    myWhile(condition)(body)
  } else ()
```

Other noted things:

* In Python, if you don't write ```import foo```, then you cannot use
```foo.bar```. In Java on the other hand, even if you don't have any ```import
com.foo.Bar;``` you can still use ```com.foo.Bar``` in the code because
everything on the classpath is available as long as you use the fully qualified
name. So in Python you can search for the import statements and reading them
will actually tell you something about the dependencies, whereas in Java the
imports are mostly an aliasing mechanism that contain little information/value.
Unsurpringly, Scala imports are similar to Java imports.

* The three main types of collections in Scala are ```Map```, ```Set``` and
```Seq``` and they all inherit from ```Iterable```. ```List``` (roughly linked
list with ```O(n)``` lookup and append) and ```Vector``` (array like with
effectively constant lookup and append) are both subclasses of ```Seq```. The
reason why ```Seq``` exists, and why ```List``` and ```Vector``` doesn't inherit
directly from ```Iterable```, is that Scala defines an implicit conversion from
Java arrays to ```Seq```. This means that you can treat Java arrays (and Strings
etc) as any other Scala collection even though they, by their nature, cannot
inherit from ```Seq```. There is an overview of performance characteristics of
Scala collection classes [here](http://docs.scala-
lang.org/overviews/collections/performance- characteristics.html).

* ```Vector``` is actually a kind of bitmapped trie with a branching factor of
32 (supposedly to make each level block roughly the size of a single cache
line). I actually checked the cache line size on my laptop (```cat
/sys/devices/system/cpu/cpu0/cache/index0/coherency_line_size```) and it was 64
bytes. So if one level of the trie has 32 pointers that would be at least
32*8=256 bytes (depending on the memory layout that the JVM would use), i.e. I
think it would actually have to pull at least four cache lines per trie level?
It would be interesting to investigate this data structure a bit closer at some
point.

* Some of the good stuff in Scala (like arrow functions) made it into Java 8,
but this also caused some (partial) overlap. For example Scala ```Option``` vs
Java 8's ```Optional```. But it's hard to do map/filter in Java and not miss
Scala's placeholder syntax for anonymous functions for example.

* Scala actually lets you declare the type variance by annotating the type
parameter of a generic type: you write ```class MyType[+A] {}``` for covariance,
```class MyType[+A] {}``` for contravariance and ```class MyType[A] {}``` for
non-variance. Of course mutable types cannot be covariant without breaking type
safety so you have to be careful. The rules that determine what kind of variance
that makes sense for a given type parameter is roughly (not but exactly):
covariant type parameters maybe only be used for method results, contravariant
type parameters maybe only be used for method arguments. Non-variant type
parameters can be used anywhere.

* Generic types in Scala have the same type erasure issue as you see in
Java/Haskell/ML etc, so at runtime a list of integers and a list of strings
appear to have the same type. So if you ran the following Scala code:

```scala
List(1,2,3) match {
  case l : List[String] => println("wtf")
  case _ => println("bacon")
}
```

..there would be no bacon for you. If you want bacon, go with C++/C# or F#.





<p class="footnote"><a name="footnote1">1</a>: For example, "repeated parameters" declared with
```T*``` cannot be passed using "call-by-name" although there are some cleanup
efforts to remove oddities like that.</p>
<p class="footnote"><a name="footnote2">2</a>: In ALGOL 60, from what I understand, you could even pass an "lvalue" as call
by name and assign to it. This made it possible to sum the first 100 elements of
an array using a call like Sum(i, 1, 100, V[i]) which is pretty funky (also leads to "interesting" effects if you call swap(i,a[i]) and so on). See the Wikipedia article on <a href="https://en.wikipedia.org/wiki/Jensen%27s_Device">Jensen's Device</a></p>
