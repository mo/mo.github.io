---
layout: post
title:  "MongoDB: Basics"
date:   2017-01-18
tags:   backend
---

# Q: How can I see what databases/collections is available?

Launch the Mongo DB shell by running ```mongo``` (for localhost, or specify some
custom host/port along with ```-u USERNAME -p``` etc). Once inside the shell,
run:

```js
show dbs
use some_database
show collections
```

You can also launch ```mongo HOST:PORT/DB -u USERNAME -p``` to directly open
the ```DB``` database.

# Q: How can I find documents?

```js
// The 'use' command works even if the database doesn't exist yet
use my_database

// Use Javascript regex syntax to find documents where the name contains "Ma",
// so that it finds for example documents with names "Martin", "Maxwell" and "iMac".
db.persons.find({ name: /Ma/ })

// Find documents where the name starts with "Ma"
db.persons.find({ name: /^Ma/ })

// Find documents where nicknames is an array that contains the element "foo"
db.persons.find({ nicknames: "foo" })

// Find persons who have exactly 14 nicknames
db.persons.find({ nicknames: { $size: 14 }})

// Find persons whose name is not "Susan"
db.persons.find({ name: { $ne: "Susan" }})

// Find persons whose name is not "Susan" nor "Whitney"
db.persons.find({ name: { $nin: ["Susan", "Whitney"] }})

// Find persons that is either born 1953 or named "Cait"
db.persons.find({ $or: [{ birthYear: 1953 }, { fullname: "Cait" }]})

// Find persons aged 30 to 35
db.persons.find({ age: { $gt: 30, $lt: 35 }})

// Find persons named "Earl" whose age is <= 30
db.persons.find({ $and: [{ name: "Earl" }, { age: { $lte: 30 }}]})

// Find persons named "Earl" whose age is <= 30 (using $where and JS expression)
// NOTE: Slow because A) JS is evaluated once per doc, and B) index is not used.
db.persons.find({ $where: 'this.name == "Earl" && this.age <= 30'})

// Find persons where the age is not set (returns persons with "age: null" though)
db.persons.find({ age: { $exists: false }})

// Find persons where the age is a number
db.persons.find({ age: { $type: "double" }})

// Find persons where the age is a string
db.persons.find({ age: { $type: "string" }})

// Find persons born 2010 or later, given that "born" is ISODate field
db.persons.find({ born: { $gte : ISODate("2010-01-01") }})

// Find persons born 2010 or later, given that "born" is NumberLong(unix_millis)
db.persons.aggregate([
  { $match: { born: { $gte : ISODate("2005-01-01").getTime() }}},
  { $project: { born: { $add: [new Date(0), "$born"] } }}
])
```

# Q: How can I limit/sort my .find() results?

```js
// Find the 5 most awesome things among "items"
db.items.find({}).sort({ awesomeness: -1 }).limit(5)

// Find the 5 most awesome things among "items" (sort/limit order doesn't matter!)
db.items.find({}).limit(5).sort({ awesomeness: -1 })
```

NOTE: At first glance it might feel a little bit counter-intuitive that the
order of sort/limit doesn't matter, but this is [indeed the
case](https://docs.mongodb.com/manual/reference/method/db.collection.find
/#combine-cursor-methods) and so you should think of this chain of calls as
"building an iterator with certain properties". If you really want to limit
first, you can use an aggregation pipeline instead, i.e.
```db.items.aggregate([{ $limit: 5 }, { $sort: { awesomeness: -1 }}])```.

# Q: How can I find documents where an embedded array of subdocuments contain at least one matching some criteria?

Use ```$elemMatch```, like this:

```js
// Assuming you have the following books collection:
db.books.insert({
    title: "first",
    reviews: [
        { stars: 5, comment: "good!!" },
        { stars: 1, comment: "omg, not good" }
    ]
})
db.books.insert({
    title: "second",
    reviews: [
        { stars: 2, comment: "mostly crap" }
    ]
})
db.books.insert({
    title: "third",
    reviews: [
        { stars: 5, comment: "love it" }
    ]
})
db.books.insert({
    title: "fourth",
    reviews: [
        { stars: 5, comment: "jk lol" }
    ]
})

// Find books with at least 1 five star review and with a comment other than "jk lol"
db.books.find({ reviews: { $elemMatch: { stars: 5, comment: { $ne: "jk lol" }}}})
```

# Q: How can I insert documents into a Mongo DB collection?

```js
use my_database

// Insert one document
db.persons.insert({ name: "John Doe" })

// Insert multiple documents
db.persons.insertMany( [{ name: "James" }, { name: "Ben" }] )
```

# Q: How can I update documents in a Mongo DB collection?

```js
use my_database

// Find the first document with a specified name and set born/gender fields on it
db.ppl.updateOne({ name: "Jake Weary" }, { $set: { born: 1990, gender: "male" }})

// Find a document and set gender, and create the document if it doesn't exist
db.ppl.updateOne({ name: "Cait" }, { $set: { gender: "female" }}, { upsert: true })

// Find a document and append "actor" to the array field "occupations"
db.ppl.updateOne({ name: "Jake Weary" }, { $push: { occupations: "actor" }})

// Append 42 to array "nums" on all documents in "ppl" (create array if needed)
db.ppl.updateMany({}, { $push: { nums: 42 }})

// Remove last element from "nums" on all documents (do nothing on empty arrays)
db.persons.updateMany({}, { $pop: { nums: 1 }})

// Remove all instances of 42 from array "nums" on all documents in "ppl"
db.ppl.updateMany({}, { $pull: { nums: 42 }})

// Remove field "age" for all documents
db.ppl.updateMany({}, { $unset: { age: 1 }})

// Increase the foo_count and bar_count of all people
db.ppl.updateMany({}, { $inc: { foo_count: 1, bar_count: 1 }})

// Rename a field from "name" to "fullname" in all "ppl" documents
db.ppl.updateMany({}, { $rename: { name: "fullname" }})

// Find first document with name: "Eva" and replace it with the specified document
// NOTE: All fields except _id are dropped unless present in the replacement doc
db.ppl.replaceOne({ name: "Eva" }, { name: "Eva", occupations: ["dentist"] })
```

NOTE: For some use cases ```.findAndModify()``` is a better fit.

# Q: How can I delete documents in a Mongo DB collection?

```js
// Delete the first document that matches the specified criteria
db.items.deleteOne({ _id: 123 })

// Delete all documents that matches the specified criteria
db.items.deleteMany({ color: "green" })
```

NOTE: For some use cases ```.findAndDelete()``` is a better fit.

# Q: How can I see all distinct values that are currently used for a particular field across a particular set of documents?

```js
> use my_database

// Show all distinct values used for "category" field across all "items"
db.items.distinct("category", {})

// Show all distinct values used for "nuance" across documents with "color": "green"
db.items.distinct("nuance", { color: "green" })
```

# Q: How can I evaluate aggregate functions over a Mongo DB collection?

```js
// Assuming documents like these:
db.staff.insert({ name: "Adam", team: "sales", age: 42, type: "fulltime" });
db.staff.insert({ name: "Ben", team: "sales", age: 33, type: "fulltime" });
db.staff.insert({ name: "Craig", team: "engineering", age: 29, type: "fulltime" });
db.staff.insert({ name: "David", team: "hr", age: 47, type: "fulltime" });
db.staff.insert({ name: "Eric", team: "engineering", age: 19, type: "contractor" });

// Compute the number of non-full time employees in each team
db.staff.aggregate([
    { $match: { type: { $ne : "fulltime" }}},
    { $group: { _id: "$team", teamCount: { $sum: 1 }}}
])

// Compute the average age of full time employees for each team (oldest first)
db.staff.aggregate([
   { $match: { type: "fulltime" }},
   { $group: { _id: "$team", averageAge: { $avg: "$age" }}},
   { $sort: { averageAge: -1 }}
])

// Compute the average age of all full time employees
db.staff.aggregate([
   { $match: { type: "fulltime" }},
   { $group: { _id: null, averageAge: { $avg: "$age" }}}
])

// Compute the max and min age for each team
db.staff.aggregate([{
  $group: {
    _id: "$team",
    minAge: { $min: "$age" },
    maxAge: { $max: "$age" }
  }
}])

// Compute the max and min age for the company
db.staff.aggregate([{
  $group: {
    _id: null,
    minAge: { $min: "$age" },
    maxAge: { $max: "$age" }
  }
}])
```

# Q: How can I do "group by" / aggregate for date fields?

```js
// Assuming a collection "events" with randomly timestamped documents, e.g:
[...Array(20)].forEach(_ =>
  db.events.insert({ when: new Date(Date.now() * Math.random()) })
)

// Compute how many "events" there were for each year
db.events.aggregate([
  { $group: { _id:{ $year: "$when" }, count: { $sum: 1 } }},
  { $sort: { _id: -1 }}
])

// Assuming timestamps are "unix_millis" (Number) rather than ISODate(), e.g:
[...Array(20).keys()].forEach(i =>
  db.log_items.insert({ whenNum: Math.floor(Date.now() * Math.random()) })
)

// Compute how many "log_items" there were for each year, given that
// whenNum is a field of type Number that stores millis since the Unix epoch
db.log_items.aggregate([
  { $project: { whenDate: { $add: [new Date(0), "$whenNum"] }}},
  { $group: { _id: { $year: "$whenDate" }, count:{ $sum:1 }}},
  { $sort: { _id: -1 }}
])

// Finally, here is how to group by day instead, i.e. YYYY-MM-DD
db.log_items.aggregate([
  { $project: { when: { $add: [new Date(0), "$whenNum"] }}},
  { $group: {
    _id: {
      year: { $year: "$when" },
      month: { $month: "$when" },
      day: { $dayOfMonth: "$when" }
    },
    firstWhen: { $first: "$when" },
    count: { $sum: 1 }
  }},
  { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 }},
  { $project: {
    _id: 0,
    date: { $dateToString: { format: "%Y-%m-%d", date: "$firstWhen" }},
    total: "$count"
  }}
])
```

You can also use ```$limit``` if you just need the first N results, or
```$skip``` if you don't care about the first N results.

# Q: How can I "join" two collections in a query?

```js
// Show "persons along with their favorite pokemon" for persons that have one
db.persons.aggregate([
  { $lookup: {
    from: "pokemons",
    localField: "favorite_pokemon",
    foreignField: "_id",
    as: "favorite_pokemon_doc"
  }},
  { $unwind: "$favorite_pokemon_doc" }
]).pretty()
```

Since ```$lookup``` can run any query on the foreign collection, it can return
more than one document and therefore the result field specified in the ```as:```
parameter (```favorite_pokemon_doc``` in this case) will be an array of matched
documents.

However, when you're doing ```$lookup``` with ```foreignField: "_id"``` you
actually know that the resulting array will always have length 1 or 0. That is,
if there was a ```favorite_pokemon``` set, the ```favorite_pokemon_doc``` field
will be array of 1 element that contains the corresponding pokemon document.
For this case, the ```unwind``` aggregation stage will convert the
```favorite_pokemon_doc``` field from an array of 1 element to just a non-array
field with that element as the value.

Further, if there was no ```favorite_pokemon``` set (or it was set to null),
```favorite_pokemon_doc``` will be an empty array. For that case, the
```$unwind``` aggregation stage will omit that person document completely
(similar to how inner joins work in SQL).

If you prefer to leave such a document in the aggregation output, just pass the
```preserveNullAndEmptyArrays``` option to the ```$unwind``` stage, like this:

```js
// Show persons (along with the favorite pokemon IF they have one)
db.persons.aggregate([
  { $lookup: {
    from: "pokemons",
    localField: "favorite_pokemon",
    foreignField: "_id",
    as: "favorite_pokemon_doc"
  }},
  { $unwind: {
    path: "$favorite_pokemon_doc",
    preserveNullAndEmptyArrays: true
  }}
]).pretty()
```

# Q: How can I measure how much time a query took?

Enable the database profiler for all queries in the current database using
```db.setProfilingLevel(2)``` (you can also set this to ```1``` to have it log
only queries above a certain millisecond threshold; useful for production
tuning).

When profiling is enabled, each query is logged together with how long it took
and various other metadata into a 1MB capped collection called
```system.profile```. This collection can be queried using regular ```find()```
and ```aggregate()``` calls.

```js
// Show execution time and other metadata for the last query or operation
db.system.profile.find({}).sort({ ts: -1 }).limit(1)

// Show execution time etc for the last query, but include only some basic info
db.system.profile.find({}, {
  op:1, ns:1, query:1, docsExamined:1, nreturned:1, responseLength:1,
  millis:1, planSummary:1, ts:1, client:1, appName:1, user:1
}).sort({ ts: -1 }).limit(1)

```

# Q: How can I create an index for a particular field?

```js
// First create a collection with some documents
db.nums.insertMany([...Array(10000).keys()].map(i => ({ indexed: i, unindexed: i })))

// Create index for the field called "indexed"
db.nums.createIndex({ indexed: 1 })

// Fast
db.nums.find({ indexed: 42 })

// Slow
db.nums.find({ unindexed: 42 })
```

# Q: How can I see the existing indexes in a collection?

```js
// List indexes along with index names
db.nums.getIndexes()

// List size in bytes of all indexes in "nums" collection
db.nums.stats().indexSizes
```

# Q: Should I use "camelCase" or "snake_case" for Mongo DB collection and field names?

Since Mongo DB collection names are case sensitive, it's a good idea to keep the
names lower case only (and then "snake_case" makes more sense). It also makes
sense to use plural names for collections. Don't use a hyphen in collection
names because you'll be forced to type ```db["foo-bar"].find()``` in mongo shell
instead of the usual ```db.foobar.find()```.

Given that all documents already contain the mandatory ```_id``` key, it looks
nice if references to documents in other collections are named ```user_id``` etc.
Don't use ```$``` in any names because some mongo drivers doesn't handle it well.

