---
layout: post
title:  "The 'wait-for' command line utility"
date:   2016-09-08
tags:   tools
---

As a software developer, quite often there are things you cannot do until some
semi-long process has completed. For example, waiting for a new build, an
automated test run or when deploying to a cluster and you want to know when all
machines have finished updating.

If you're running a local build you would do ```build ; show-notification 'build
done'``` (e.g. on Debian/Ubuntu you'd use ```notify-send``` for this). However,
if you're waiting for a build on a CI machine you typically have to reload some
webpage to see if it's done or query job progress by curling some API.

To be able to get a notification when such jobs are done, I wrote a Python
script called ```wait-for``` that repeatedly runs some command until the command
prints some particular string (or returns a specified exit code, or prints
something different from what it printed last time it was invoked).

This script makes it easy to do stuff like for example:

```bash
$ # Suppose OpenSSL (or similar) has announced that they will publish a new
$ # security fix today and you want a notification when they publish the details.
$ CHANGELOG="https://www.openssl.org/news/changelog.txt"
$ wait-for --stdout-change "curl -s $CHANGELOG" ; notify-send "It's published"

$ # Suppose you have a scruffy old Jenkins server, and you want to wait for the
$ # next successful build and then deploy that to some staging environment.
$ URL="http://jenkins.ecorp.com/job/SOME_JOB_NAME/lastSuccessfulBuild/api/json"
$ wait-for --stdout-change "curl -s $URL | jq .number" ; deploy-latest-successful
```

The ```wait-for``` source code is available [here](https://github.com/mo/wait-
for); it even has a few
[tests](https://github.com/mo/wait-for/blob/master/tests/run-tests). The
tests were written in bash because that was obviously a good idea (my
condolences to the kittens that died as a result).

<br>

**EDIT**: After posting this, someone pointed out the fact that
```watch --chgexit cmd``` covers the above use case, so wait-for is only useful
if you actually need ```--stdout-contains``` or ```--stdout-equals``` etc.
