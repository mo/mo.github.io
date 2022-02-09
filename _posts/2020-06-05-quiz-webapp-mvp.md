---
layout: post
title: Webapp for making quizzes
date: 2020-06-05
tags: web
---

I have been working on a little webapp for making quizzes (for fun or exam
prep), called [Quizbert](https://quizbert.com), and now an initial version of it
is online!

I originally started building another quiz webapp in 2002 using PHP/MySQL. It was
possible to signup for free in this webapp and create your own quizzes. While
most of the application worked well, there was some parts of the application
that was never really finished. I used this webapp myself to create exam prep
quizzes during the last year of my university studies. I kept this webapp online
but I never mentioned it anywhere so there was no users other than me.

In 2015 I switched jobs from C++/Java development to web development and after
two years I wanted to learn more modern web development tools. For example, I
wanted to try out [React](https://reactjs.org/) and [node](https://nodejs.org/),
which we didn't use "at work" at the time. So in March 2017 I started to port
that old PHP application to node + react, as a learning experience. Since the
old webapp was a multi page application with forms and no XHR, pretty much all
code was rewritten from scratch but I did manage to save the database so I could
keep all the quizzes I had created.

During 2018 I put a lot of effort into creating a great test suite and a good
deployment setup for this application. I created prod + test servers on [Digital
Ocean](https://www.digitalocean.com/), and wrote scripts to cleanly rebuild
those servers from scratch in a fully automatic fashion. I moved the webapp
behind [haproxy](https://haproxy.org) so that I could run more web applications
on the same host in the future. I also created a Kubernetes setup for the app
but it ended up being a bit too complex and it also cost more so I ended up
not using it.

Somewhere along the way I found the excellent
[indiehackers.com](https://www.indiehackers.com/) podcast, which in turn linked
to a bunch of other inspiring bootstrapping stories (e.g. [Build your
SaaS](https://saas.transistor.fm/) and [Pieter
Levels](https://twitter.com/levelsio)). From this listening/reading grew the
idea that maybe I should try to build a product rather than a project. I've
started and contributed to many open source projects before, but I had never
tried to monetize anything.

During 2019 I integrated the webapp with [Stripe](https://stripe.com) so it had
a billing backend. During this time I migrated from MySQL to
[PostgreSQL](https://www.postgresql.org/) and I also spent some time learning a
few basic business administration skills like accounting, taxes (e.g.
[MOSS](<https://en.wikipedia.org/wiki/European_Union_value_added_tax#Mini_One_Stop_Shop_(MOSS)>)),
and I wrote some software that could automatically get transactions and VAT etc
booked properly in an [accounting system](https://fortnox.se). This software
also generates EU VAT compliant invoices (which Stripe doesn't do), handles
things like proration for subscription down/upgrades, refunds etc.

This project/product has been a really nice learning experience, even though it's
still mostly an engineering project. I didn't do any marketing and I havn't
published any new content/quizzes.
