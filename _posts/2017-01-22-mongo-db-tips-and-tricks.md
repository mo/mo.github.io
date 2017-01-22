---
layout: post
title:  "MongoDB: Tips & Tricks"
date:   2017-01-22
tags:   backend
---

# Q: How can I get pretty-printed JSON by default in mongo shell?

Add this to your ```~/.mongorc.js```:

```js
DBQuery.prototype._prettyShell = true
DBQuery.prototype.unpretty = function () {
        this._prettyShell = false;
        return this;
}
```

After you do this, ```db.persons.find({ _id: 71077345 })``` will be
pretty-printed and ```db.persons.find({ _id: 71077345 }).unpretty()``` can be
used to opt out of pretty-printing where needed. Opting out of pretty-printing
is useful when you want to get an overview a small number of fields taken from
multiple documents (i.e. each projected document still fits on a single line),
for example calls like ```db.persons.find({}, {name:1, email:1})``` are often
hard to read unless you append ```.unpretty()```.

# Q: What controls how much .find() prints before asking to type "it"?

Set ```DBQuery.shellBatchSize = 50``` or similar in ```~/.mongorc.js```.

# Q: How can I see how a particular MongoDB server is configured?

First login to the server via mongo shell, then you can find the command line
arguments that was used to start ```mongod``` (i.e. switches in general and
```--config foo.conf``` in particular) using:

```js
> use admin
> db.runCommand({ getCmdLineOpts: 1 })
```

# Q: How can I aggregate the system profile log to find the last/slowest query per user?

Turn on the database profiler by running ```db.setProfilingLevel(2)```, then
wait a while, and finally run something like:

```js
// Search profiling log for the last query each user did
db.system.profile.aggregate([
  { $sort: { ts: 1 }},
  { $group: {
    _id: { user: "$user", client: "$client" },
    millis: { $last: "$millis" },
    op: { $last: "$op" },
    query: { $last: "$query"}
  }}
])

// Search profiling log for the slowest query each user did
db.system.profile.aggregate([
  { $sort: { millis: 1 }},
  { $group: {
    _id: { user: "$user", client: "$client" },
    millis: { $last: "$millis" },
    op: { $last: "$op" },
    query: { $last: "$query"}
  }}
])
```

Instead of the above two commands, you can put the snippet below in your
```~/.mongorc.js``` and get a slightly more pretty-printed overview of
slowest/last query per user by running the ```lastms()``` and ```highms()```
functions:

```js
function userprof(sort, kind) {
    const summary = db.system.profile.aggregate([
        { $sort: sort },
        { $group: {
            _id: { user: "$user", client: "$client" },
            last: { $last: "$$ROOT" }}}
    ]).map(user => {
        const details = JSON.stringify(user.last.query || user.last.command);
        return `${kind} operation (${user.last.op})
                by ${user._id.user || "anonymous"}
                from ${user._id.client}
                took ${user.last.millis} ms
                at ${user.last.ts}
                details: ${details.substring(0,80)} ...`.replace(/\n */gm, ' ')
    })
    db.system.profile.aggregate([
        { $sort: { ts:1 } },
        { $group: {
            _id: null,
            first: { $first: "$ts" },
            last: { $last: "$ts" }
        }}
    ]).forEach(res => {
        print("Based on system.profile data from: ", res.first)
        print("                               to: ", res.last)
    });
    print(summary.join("\n"))
}

lastms = () => userprof({ts:1}, "last")
highms = () => userprof({millis:1}, "slowest")
```

# Q: How can I make sure that I don't accidentally run a query that takes too much CPU / time?

For very large collections it can be very CPU / time expensive to run queries
that uses non-indexed fields. In production you probably shouldn't do unindexed
querying at all, but if you're just trying out queries in mongo shell, or if you
are digging out some one-off debugging information from the database you might
need to do it. In these situations, you can limit the maximum number of
documents to scan by using the ```.maxScan()``` cursor method, and/or you can
limit the maximum numbers of milliseconds a query may take using the
```.maxTimeMS()``` cursor method.

```js
// Try to find documents with property "unindexed" set to "some value", but
// spend at most 30 ms looking and then return an "exceeded time limit" error.
db.things.find({ unindexed: "some value" }).maxTimeMS(30)

// Try to find documents with property "unindexed" set to "some value", but
// check in at most 1000 documents before giving up (no error, just empty result)
db.things.find({ unindexed: "some value" }).maxScan(1000)
```

# Q: If Mongo DB is unusually slow, how can I see what it is doing?

Sudden slowness can be due to many things, for example:

* unusually large amount of queries / second
* queries that use unindexed fields in large collections
* a large index being built
* CPU heavy ```.mapReduce()``` operations

You can list the on-going operations by running ```db.currentOp().inprog``` and
paying extra attention to the entries with large ```.secs_running``` values. To
see the relevant query look in the ```.query``` field. There is also an
```.opid``` field which contains an operation ID that you can pass to
```db.killOp()``` to abort that particular operation (you may only abort
operations associated with a ```.client``` though, never internal database
operations). Finally, for index building and map reduce operations you can find
progress information in the ```.progress``` field.

If you want a slightly nicer formatting, you can put the snippet below in your
```~/.mongorc.js``` and then run ```currentOps()``` instead:

```js
String.prototype.ljust = function (width, padChar) {
    padChar = padChar || ' ';
    if (this.length < width)
        return this + Array(width - this.length + 1).join(padChar);
    else
        return this;
};

function currentOps() {
    var COLUMNS = [
        { title: 'OPID',   field: 'opid',         width: 20 },
        { title: 'CLIENT', field: 'client',       width: 22 },
        { title: 'SECS',   field: 'secs_running', width: 7 },
        { title: 'PRGR',   field: 'progress',     width: 5 },
        { title: 'DESC',   field: 'desc',         width: 45 },
        { title: 'QUERY',  field: 'query',        type: 'json' },
    ];
    print(COLUMNS.map(function (col) {
        return col.title.ljust(col.width);
    }).join(''));
    db.currentOp().inprog.forEach(function (op) {
        print(COLUMNS.map(function (col) {
            if (col.type == 'json') {
                return JSON.stringify(op[col.field] || '');
            } else {
                return ('' + (op[col.field] || '')).ljust(col.width)
            }
        }).join(''));
    });
}
```

# Q: How can I tell which of my collections are taking the most time in queries?

Launch ```mongotop --host HOST --port PORT --username USER -p```. By default it
updates once every second and the total column shows how much of that time was
spent in each collection.

# Q: How can I see the current number of inserts/queries etc per second?

Use ```mongostat --host HOST --port PORT --username USER -p``` for a single
server and append ```--discover``` for sharded/replication deployments (in this
case mongostat reports separate QPS etc for each member).

The first 4 numbers (i.e. insert/query/update/delete) are the number of such
operations per second.

# Q: How can I create a large index in the background without disrupting other queries?

Set the ```background``` option, like this:

```js
db.persons.createIndex({ name: 1 }, { background: true })
```

The drawback of building an index in the background is that it usually takes a
bit longer and will initially result in an index that consumes more storage
space, but over time the size will be the same as an index built in the
foreground. Also note that even if you build the index with ```background:
true```, the createIndex() call will still block in mongo shell until the index
is finished.

# Q: Why doesn't Mongo output proper JSON? Why does NumberLong() etc exist?

The Javascript numbers are represented by the data type ```Number``` which a
64-bit floating point type, and Javascript (and JSON) doesn't have any 64-bit
integer data types.

The largest integer that can be stored in a signed 64-bit in Java etc, i.e.
9223372036854775807, it cannot be stored in Javascript. If you fire up a JS repl
and do ```x = 9223372036854775807```, the value that will be stored is
```9223372036854776000``` instead of ```9223372036854775807```. However, all
integers up to and including 9007199254740991 (available as
Number.MAX_SAFE_INTEGER) can be represented exactly in Javascript so it's usable
as a ```ln(9007199254740991)/ln(2) = 53-bit``` integer type at least. The
problem is that databases really need proper 64-bit integers so the Mongo DB
authors had no option but to extend Javascript and thus making JSON export of
mongo data a bit more complicated. For example, you can't pipe Mongo DB output
directly to generic JSON processing tools like ```jq``` etc without ```{ "_id" :
NumberLong("11261548633"), ... }``` hitting "parse error: Invalid numeric
literal" or similar.

If you really want proper JSON, you need to run an export via the
```mongoexport``` command instead:

```
$ mongoexport --quiet -d some_db -c some_collection -q '{}' | jq .
{
  "_id": {
    "$oid": "58832c084b6e95ac2050eac4"
  },
  "some_number": 123,
  "some_numberlong": {
    "$numberLong": "123"
  },
  "some_isodate": {
    "$date": "1818-05-05T00:00:00.000Z"
  }
}
```

If you do that, all non-JSON constructs including NumberLong, ISODate and
ObjectID etc will be stored as special ```{ "$keyword": "value_as_string" }```.

The ```-q``` parameter passed to mongoexport can be used to specify any query.

# Q: How can I tell which storage engine that Mongo DB is using?

Check by running this in mongo shell:

```js
db.serverStatus().storageEngine
```

WiredTiger is enabled by default if you create a new database using 3.x but if
you upgraded from an earlier version of Mongo DB you might still be running the
older ```mmapv1``` engine. WiredTiger doesn't just have different performance
characteristics compared to older engines, it also has document-level locking so
it's a good idea to have the same storage engine on development and production
machines.

# Q: How can I create a TTL collection?

TTL ("time to live") collections delete their documents when a a timestamp field
is older than given amount of time.

```js
// Automatically delete docs with "when" timestamp older than 10 secs
db.log_events.createIndex({ when: 1 }, { expireAfterSeconds: 10 })

// Insert a document with an ISODate() timestamp
db.log_events.insert({ when: new Date() })
```

# Q: How can I see when a document was created?

It's a good idea to have an explicitly "created" field if you need it, but if
you didn't create one, there is a trick to find out when a document was created
anyway (at least for documents where the ```_id``` is an ```ObjectID```, just
do:

```js
ObjectId("505bd76785ebb509fc183733").getTimestamp()
```

# Q: What is db.foo.mapReduce() used for?

db.foo.mapReduce() evaluates aggregate functions over a collection, just like
db.foo.aggregate() does. The former is typically **a lot** slower, but it is
more flexible because the map/reduce functions are specified as Javascript
functions. The latter only has a fixed (but quite large) number of possible
aggregation operators etc, and they are all implemented in native code for
maximum performance.

To call ```.mapReduce()``` just pass a map function, a reduce function and then
set options like a query, and ```out: { inline: 1}``` to return the results
directly instead of storing them in a new collection.

Beware that, because ```.mapReduce()``` passes the input to the map function
via ```this```, you cannot use ES6 fat arrows when you define the map function.

```js
// Find all distinct values used for .type in "accounts" documents
db.accounts.mapReduce(
    function () {
      emit("types", this.type);
    },
    function (key, values) {
      return { unique: [...new Set(values)] }
    },
    {
      query: {},
      out: { inline: 1 }
    }
)
```
