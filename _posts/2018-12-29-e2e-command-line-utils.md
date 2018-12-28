---
layout: post
title:  End-to-end testing command line utilities
date:   2018-12-29
tags:   programming quicktip
---

A quick and clean way to write end-to-end testcases for command line utilities
is the ```cram``` testing framework. You can install cram using ```pip install
cram``` (or inside virtualenv), and then create a file called ```test1.t``` with
the following contents:

```sh
The first testcase

  $ echo abc
  abc

  $ echo -e 'a\nb\nc' | wc -l
  3

Launch /bin/false and verify that it exits with exit code 1

  $ /bin/false
  [1]

Launch sub-shell and verify that it exits with exit code 42

  $ (echo abc ; exit 42)
  abc
  [42]

cram will verify that exit code is 0 if no expected exit code N is written as [N]

  $ true

Testcases will be skipped if do you do "exit 80"

  $ echo abc && exit 80

cram can also invoke multiline commands

  $ cat /proc/cpuinfo | grep bogo | \
  > cut -f 2 -d : | \
  > awk '{s+=$1} END {print s}' | \
  > wc -l
  1

You can also invoke multiple commands

  $ export ABC=def
  $ echo $ABC
  def
```

You can then run the test using ```cram test1.t```. Another nice feature is the
interactive mode where you can automatically make the actual output become the
expected output (i.e. just like snapshot testing in ```jest```).

Writing tests with cram is extremely powerful because you have all your regular
command line tools available. For example, you can curl some API and assert that
the response looks reasonable.

Kudos to [Brodie Rao](https://github.com/brodie) for creating this awesome tool!