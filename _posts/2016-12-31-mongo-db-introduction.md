---
layout: post
title:  "MongoDB: Introduction"
date:   2016-12-31
tags:   backend
---

[MongoDB](https://www.mongodb.com/) (from "humongous") is an open-source
document-oriented NoSQL database. Much like relational databases have rows
stored in tables, MongoDB has "documents" stored in "collections". Documents are
essentially blobs of JSON data. In a relational database, all rows in the same
table have the same set of columns, but in MongoDB the documents in a
collection can have a different schemas (though, quite often you find some
minimal structure that is shared among all documents in a single collection, if
nothing else there is at least the mandatory ```_id``` field in every document).

As the name suggests, MongoDB is engineered to allow really large databases.
MongoDB attempts to improving scaling compared to relational databases using two
trade-offs, namely:

* store information in denormalized form to enable horizontal partitioning
(shards), and

* offload work from the database servers to frontend servers wherever possible.

For example, if you're implementing a social network where each user publishes a
stream of 140-char "posts", in MongoDB you could<sup>[1](#footnote1)</sup>
naively just embed the posts as items in an array on the user document. Instead
of JOINing a ```user``` table with a ```posts``` table the user document already
contains everything needed to render a timeline that shows all the posts for
that user. The benefit of this denormalized form, where you have "everything you
need" in a single document, is that you can split up the document index among N
machines and run queries N times faster (horizontal partitioning / sharding).
Notably, the machine that "owns" a particular document can handle both reads
from **and writes** to that document.

Splitting a table among N machines like that is much harder to do in relational
database, because often your primary table is related to a bunch of other
secondary tables, possibly in many-to-one mappings, and then after splitting the
primary table up in N shards, the database has to figure out which rows in the
secondary table that should live on each shard. However, since this was a many-
to-one mapping there will be such rows that needs to live on multiple shards,
and now which one of these "copies" is the master copy? And JOINing data from
several of the N machines will be slow and defeats the purpose of the N-split.

Traditionally, the easy way to scale up a relational database is to start with
read-write splitting so that all writes goes to a master node. The master node
is then continuously replicated out to N read nodes and all incoming read
queries are scheduled round-robin over the N read nodes. However, this only
works if the number of writes you're getting can be handled by one (really high
end) machine. Of course, relational databases also have support for proper
sharding where writes are handled by N machines, but it's quite complicated to
setup and, most importantly, the way you set it up depends a lot on your
database schema and your workload. This is the point where you pay a lot of
money to hire a good (expensive!) DBA.

While the first trade-off listed above was largely about "avoid joins because
they make horizontal partition hard", the truth is that you cannot really avoid
joins for real world data. The second trade-off (i.e. that MongoDB offloads more
work to the frontend servers compared to relational databases) is about how
MongoDB deals with the remaining "joins".

Suppose we're still implementing our own social network, but we want to change
the design a bit. Now we want the posts to have a title and allow them to be
much longer. If we still embedded the posts on the user document, we'd soon run
into MongoDBs maximum document size of 16MB, so we need to move the posts to
their own collection. At this point we could use either **child-referencing**
(letting the ```posts``` field in the user document be an array of document IDs
from the ```posts``` collection) or **parent-referencing** (letting each post the
```posts``` collection have a ```author``` field that contains a document id
of the user collection) to connect the collections.

If you anticipate a **very** large amount of documents in a related collection
(perhaps it contains log lines or similar) then you should go with parent-
referencing because the IDs alone might make parent document bloated. One
benefit of the child-referencing model is ordering of the children (especially
for many-to-one relationships where the ordering cannot be stored in the child
collection). For tree-like hierarchical structures where you need to find
ancestors/descendants efficiently, you should look into [materialized paths or
nested sets](https://docs.mongodb.com/manual/tutorial/model-tree-structures/)
instead.

Regardless of whether we do child or parent-referencing, when we want to render
a profile page for user FOO that includes (at least) the titles of his/her
posts, then we need to do another query to get the titles. For child-referencing
we wait until we get the ```posts``` IDs from the first query, and then we use
those IDs in the second query (two serialized roundtrips from the frontend
server to the mongo server might be slow). For parent-referencing we can send
both queries immediately, but it's still two queries. In both cases we're
effectively doing a JOIN in application code.

On one hand, application JOINs are just business as usual for NoSQL. The MongoDB
client libraries even have explicit support for them via the
[DBRef](https://docs.mongodb.com/manual/reference/database-references/#dbref-
explanation) feature; which stores the collection name along with the foreign
document ID so that the client library can load them automatically (i.e. much
like a foreign key except it's actually the MongoDB client library that resolves
the reference and not the database server).

However, if JOINing in application code just isn't fast enough, one other option
is too [denormalize](https://en.wikipedia.org/wiki/Denormalization) further by
duplicating data and including copies of the post titles directly in the user
document. This means that we can now render a profile page for user FOO that
includes the titles of his/her posts without the need for a second query. Of
course, whenever we update a title we also have to update the user document copy
of that title, so this change sacrifices some write performance to get better
read performance.

In addition to child and parent-referencing, there is also **two-way
referencing** (another form of denormalization). In the example above, we could
do both child-referencing and parent-referencing simultaneously, and we might
also include a copy of the username in the post document so that the post itself
can be loaded without having to query for the parent user document.

It's worth pointing out that MongoDB 3.2 and onwards does support left-outer
equi-joins via the ```$lookup``` operator, but it is only available in
aggregation pipelines and these are much slower than regular find queries. The
idea is that this functionality should only be used for analytics/reporting and
not in the main application workload.

Another important point is that MongoDB only offers atomicity on document level.
So when you're updating some field and then subsequently updating a copy of that
field living in another document, MongoDB might be running several read queries
in between and thus exposing the "inconsistent state of the database". It's also
possible that the databases crashes or restarts before the second write is
finished. Avoiding this type of inconsistencies is a big part of why one tends
to [normalize](https://en.wikipedia.org/wiki/Database_normalization) relational
database schemas in the first place.

For updates of multiple documents within the same collection, the
```$isolated``` operator can be used to prevent read operations between two
write operations but this locks the entire collection (even if you're running
the WiredTiger storage engine which in general has document-level locking),
effectively making your MongoDB server single threaded. Also, ```$isolated```
doesn't work on sharded clusters, and if the second update hits an error, the
first update is not rolled back.

Since MongoDB does not offer any way to have "all or nothing" written you need
to implement [two-phase commit](https://docs.mongodb.com/manual/tutorial
/perform-two-phase-commits/) "in application code" (another example where
problems are pushed from the database server to the frontend server). Also, even
if you do implement two-phase commit manually, you still would not get
"proper transactions" because other read operations can still see partial results.


<p class="footnote"><a name="footnote1">1</a>: If our social network also had a
view that rendered all posts from all users interleaved in chronological order,
then it would be much better to store "posts" in a separate collection. Another
caveat is that an arbitrary number of posts taken together are too big for
embedding anyway because MongoDB cannot handle documents larger than 16MB,
so even if the posts where max 140 chars the design would break down at 100k
posts.</p>




