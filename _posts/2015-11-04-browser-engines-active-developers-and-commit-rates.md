---
layout: post
title:  "Browser Engines 2015: Commit Rates and Active Developer Counts"
date:   2015-11-04
tags: web browsers
---

I used to work as a developer in the "core" group at Opera that developed the
Presto web engine. During this period, I often wondered just how many developers
Google and Mozilla had working on their codebases and how that number changed
over time. I was also curious about how pace of development changes as a code base
aged (the first versions of Opera and Chrome came out in 1995 and 2008 respectively).

I hacked together a couple of scripts that analyzes browser engine source
repositories in order to extract data on the number of developers and commit rates.
Originally my data included numbers for Opera as well but they are "closed source"
and very careful not to reveal the number of developers they have on each team;
so I had to drop those numbers from the graphs (although, of course they were a
large part of the reason why I wrote these scripts in the first place).

Finally, a quick caveat; these repositories contain slightly different kinds of
things and some projects make few but big commits and some make a lot of small
ones (e.g. "add feature", "fix bug", "fix bug", "fix bug"). And you know,
"lies, damned lies, and statistics" yada yada.

This first graph shows the number of unique developers working on mozilla-central,
chromium, webkit, blink and servo. For example, if N different developers make
at least one commit each during April and May, then for X={30th of May} the graph
is showing Y=N.

<a href="/assets/git-source-metrics-mozilla-vs-chrome-active-dev-count.png"><img src="/assets/git-source-metrics-mozilla-vs-chrome-active-dev-count.png"></a>

Some notable things about the graph above:

* Google has _a lot_ of developers working on chromium (approximately twice as many
as mozilla has working on mozilla-central).

* Up until mid-2014 Google was relentlessly adding more developers to the project,
but after that the trend stopped and instead the number of developers working on
chromium has been constant.

* The webkit/blink fork shows up clearly in this graph (webkit is the yellow line
and blink is the light blue line).

* October 2015 was the first time ever when servo had more developers than webkit.
As we shall see later on, webkit is still a bit ahead of servo in terms of commit
rate but I certainly think it's impressive that servo has managed to recruit as
many developers as they have.

* There is a tiny spike upwards in the developer count of blink just after the
fork from webkit; I looked into the specifics of this and it turns out that this
was a bunch of google developers that switched from committing using @webkit.org
addresses to committing using @chromium.org addresses instead (my script thinks
foo@webkit.org and foo@chromium.org are 2 unique developers; so those guys got
counted twice during 60 days following the fork, hence the spike). It should be
noted that my scripts are aware of the fact that foo@chromium.org and
foo@google.com are almost always the same developer so commits from those two
addresses would still just count as one developer.

* The really early numbers from mozilla-central and webkit should be taken with
a grain of salt. CVS and Subversion doesn't track author and committer
separately so if one developer wrote a patch and a committer cleaned it up + merged
it, then the non-committer developer isn't really visible at all. Also I wasn't
paying close attention to browser engines that early on so I havn't been able to
judge if those numbers are even remotely plausible or not.

The second graph shows the number of commits in mozilla-central, chromium, webkit,
blink and servo during a 60 day period. Again, as an example; if there are N
commits during April and May, then for X={30th of May} the graph is showing Y=N.

<a href="/assets/git-source-metrics-mozilla-vs-chrome-commit-rate.png"><img src="/assets/git-source-metrics-mozilla-vs-chrome-commit-rate.png"></a>

* In some sense, this graph paints a more true picture of the webkit/blink
fork; it shows the fact that Google and Apple were both strong contributors to
webkit and after the fork none of them have gotten anywhere near the previous rate of
change.

* The gigantic spike upwards for chromium around 22 sept 2015 is real in the sense
that the the numbers of commits landing in chromium increased a lot overnight,
but this was actually the blink repository being discontinued (instead blink became
a directory inside the chromium repository so in reality it's mostly a book-keeping
change).

* You can also see regular drops in the commit rate of chromium; this is Christmas
holiday breaks showing up in the data. It's interesting that these drops are not
as clear in the data from mozilla-central. I wonder if this is because chromium
is more of a "corporate gig" and mozilla has a certain labor of love element to it? :-)

* For mozilla-central you can see a clear trend change (mostly flat commit rate
turning into a steadily increasing commit rate) around 2011-06-20 which happens
to coincide with the release of Firefox 5 and the transition to the mozilla rapid
release schedule (the 6 week thing). The number of active developers in
mozilla-central started to grow a lot at that time too. Maybe they got access to
more funding or something? If someone knows for sure what activated this change
of pace for the mozilla project, please post a comment below.

Now for the third graph, I just decided to divide the number of commits by the
number of developers:

<a href="/assets/git-source-metrics-mozilla-vs-chrome-commits-per-developer.png"><img src="/assets/git-source-metrics-mozilla-vs-chrome-commits-per-developer.png"></a>

The first thing I thought about when I saw this graph was that mozilla, chrome
and webkit all started out quite high and then it was downhill from there on
(in terms of commits/dev). I hid the servo graph because the graph got too
cluttered, but it was the same thing there too. Maybe most large software
projects dig themselves into a hole of complexity, and then get stuck in that
hole and die slowly? Also, software projects tend to get more process heavy over
time, raising the requirements in terms of commit queues, test passes and code
reviews that the developers has to handle.

If you look more carefully, you can see that mozilla has actually bucked this
trend for the last few years which is quite impressive. I think it's notable how
the graphs for mozilla, chrome and blink (and actually servo as well, although
I dropped it from the image) all come in about about 10-15 commits per
developer (for a 60 day period). Webkit was always the odd one out here, often
landing at 25 commits/developer for a 60 day period, and as soon as Google took
control of it via the blink fork the commits/developer metric immediately
converged down to the "normal" level.

The fourth graph shows the active developer count for the largest non-google
companies contributing to chromium:

<a href="/assets/git-source-metrics-chromium-non-google-companies.png"><img src="/assets/git-source-metrics-chromium-non-google-companies.png"></a>

Some notable things about the above graph are:

* Intel and Opera have approximately the same number of developers working on
Chromium, although Intel first started working on Chromium about 1 year earlier
than Opera.

* Samsung has a lot more developers working on Chromium compared to both Intel and Opera.

* The number of developers Samsung has assigned to Chromium varies a lot, probably
depending on the release schedule for their "Samsung Browser" and the phones that
it ships on.

The fifth graph shows the number of active Chromium developers split into
Google and non-Google groups:

<a href="/assets/git-source-metrics-chromium-google-vs-non-google.png"><img src="/assets/git-source-metrics-chromium-google-vs-non-google.png"></a>

The graph above shows that Google is still actually increasing the number of
developers working on Chromium, just not at the same rate as before. Also, it
becomes clear that the point when Google shifted down its hiring pace was not
mid-2014 but rather it was already in May 2013 (which is still a full year after
the market share of Chrome grew beyond Internet Explorer). The thing that makes
the Google change invisible in the original "developer count" graph is in fact
the slightly insane push that Samsung in mid-2014.

That's the end of the browser stuff. Although, since I had written the scripts
to generate these graphs, I could not resist running them on a few other repos.
Below you can see commit rates for gcc vs llvm/clang:

<a href="/assets/git-source-metrics-gcc-vs-llvm-commit-rates.png"><img src="/assets/git-source-metrics-gcc-vs-llvm-commit-rates.png"></a>

This graph got a bit too cluttered (since I used just "commit count in the last
7 days" instead of the 60 days that I used above) and to fix it I experimented with another
approach; I computed a 16 week rolling average (i.e. lightgreen is that actual
commit rate in the gcc repo, while the darker green shows the rolling average).
As you can see, llvm/clang surpassed gcc sometime around 2006-2009. FWIW, I also
did a graph for inserted+deleted lines and there gcc is still mostly above
llvm/clang actually.

Here is a graph showing active developers for gcc vs llvm/clang:

<a href="/assets/git-source-metrics-gcc-vs-llvm-active-developers.png"><img src="/assets/git-source-metrics-gcc-vs-llvm-active-developers.png"></a>

And finally, here is a graph showing active developer count for golang vs rust
(also with a rolling average although it wasn't really needed for this one):

<a href="/assets/git-source-metrics-golang-vs-rust-active-developers.png"><img src="/assets/git-source-metrics-golang-vs-rust-active-developers.png"></a>

If you want to look at these graphs in more detail, they are also available as
[interactive javascript graphs](/assets/git-source-metrics-20151104/git-source-metrics/web/index.html) here.

The script that I used to generate these graphs is available at [github.com/mo/git-source-metrics](https://github.com/mo/git-source-metrics),
although I havn't had time to write any documentation etc so it's probably not that useful to someone other than me.
