---
layout: post
title:  Migrating from MySQL to PostgreSQL
date:   2019-07-09
tags:   programming backend
---

I recently migrated an old node webapp from MySQL to PostgreSQL. The application
is a little over 10k lines of code and does not use any ORM / SQL builder tool.
To convert the schema and move the data I used a little Common Lisp tool called
```pgloader``` which can convert from various other databases like MySQL, sqlite
or MSSQL.

The reasons<sup>[1](#footnote1)</sup> why I did this migration was:

* PostgreSQL feels a bit more stable / long term (I don't like that Oracle bought
  MySQL). This was the last side-project I had that was still using MySQL, so
  now I don't have to deal with MySQL anymore.
  - Porting this project to MongoDB would have been a lot more work and the
    license situation is not ideal there and also I don't like the "schemaless"
    aspect of MongoDB.
* MySQL's timestamp datatype has the 2032 problem and a long range of various
  other similar little technical limitations.
* PostgreSQL Ubuntu packages are quite well maintained. There are separate
  packages for 9.4, 9.5, 9.6, 10, 11, 12 available in parallel on 18.04


Just installing pgloader using "sudo apt install pgloader" didn't work because
it crashed and I found some GitHub issue that was fixed but the apt packaged
version did not have the fix yet. Instead I tried to run the docker version, but
it was quite painful to get that working. I had to reconfigure both mysql and
postgres to accept connections from any interface rather than just localhost,
then set a password for the ```postgres``` user (it doesn't allow password
logins by default) and add a user in MySQL that was allowed to connect from a
remote IP. Finally, I had to use the docker host IP (visible on the docker0
interface if you run ```ip addr```) both as the source and the destination. I
ended up running something like:

```shell
docker run --rm --name pgloader dimitri/pgloader:latest pgloader \
    mysql://myuser:mysqlpasswo@172.17.0.1/sourceDbName \
    pgsql://postgres:passwordForPostgresUser@172.17.0.1/targetDbName
```

Later, when I went through a similar process for a staging environment I
installed the latest version of pgloader from ```apt.postgresql.org``` instead
and that was a lot easier.

# Migrating the source code

The first step was to convert the [Mysql
SQL](https://www.npmjs.com/package/mysql) placeholders from ```?``` to
[PostgreSQL](https://node-postgres.com) ```$N``` placeholders:

```js
-  const rows = await db.query('SELECT * FROM users WHERE user_id = ?', [userId])
+  const rows = await db.query('SELECT * FROM users WHERE user_id = $1', [userId])
```

Doing this manually, would be very tedious/boring so I wrote a program that
edited my source code instead. babel is a great tool for JavaScript
source-to-source transformation, but it doesn't preserve source formatting when
it emits code. However, there is a great utility on npm called
```@codemod/cli``` that parses and emits code using
[recast](https://github.com/benjamn/recast) instead of the babels default
parser. I implemented my SQL migration utility as a babel plugin and I used the
excellent JavaScript [AST Explorer](https://astexplorer.net) to prototype the
first version. It was possible to implement the entire plugin in just 45 lines
of code:

```js
/*
 Tiny babel plugin that helps migrate node Mysql SQL to Postgres SQL.
 Run via:
 npx -p @codemod/cli codemod --plugin ./scripts/mysql-to-postgres.js src/server/foo.js
 */
const needsMigration = sql => {
  const ustr = sql.toUpperCase()
  return ustr.includes('?') && (
      ustr.includes('SELECT') ||
      ustr.includes('INSERT') ||
      ustr.includes'UPDATE') ||
      ustr.includes('WHERE') ||
      ustr.includes('DELETE')
    )
}
const migrateSql = sql => {
  let i = 0
  return sql.replace(/\?/g, _ => `$${++i}`)
}

module.exports = function (babel) {
  const { types: t } = babel
  return {
    name: 'mysql-to-postgres-sql-converter',
    visitor: {
      StringLiteral(path) {
        if (needsMigration(path.node.value)) {
          path.replaceWith(
            t.StringLiteral(
              migrateSql(path.node.value)
            )
          )
        }
      },
      TemplateElement(path) {
        if (needsMigration(path.node.value.cooked)) {
          path.replaceWith(
            t.templateElement(
              {
                raw: migrateSql(path.node.value.raw),
                cooked: migrateSql(path.node.value.cooked),
              },
              path.node.tail
            )
          )
        }
      },
    }
  }
}

```

This fixed all my SQL and preserved all source formatting but unfortunately it
also added a few semicolons. I was able to remove these automatically using
eslint though:

```js
eslint --parser babel-eslint --parser-options=ecmaVersion:6 \
       --parser-options=sourceType:module --no-eslintrc --no-ignore \
       --fix --rule 'quotes: [2, single]' src/server/foo.js
```

After this I did a few manual fixups like:

* Changed all my timestamp datatypes to ```timestamp(3) with time zone```. By default postgres has microsecond precision but that causes problems if you use node because the JavaScript ```Date``` can only represent milliseconds. If you really need microsecond precision you can use a custom type parser (see note at the bottom of [this](https://node-postgres.com/features/types) page).
* Adding ```RETURNING ...``` on ```INSERT``` statements with auto incrementing ids.
* Change a few ```INSERT ... ON DUPLICATE KEY UPDATE``` into ```INSERT ... ON CONFLICT ...```.
* Fixed all references to the MySQL specific field ```.affectedRows```.
* Fixing references to camel case column names. pgloader [renames camel case columns](https://github.com/dimitri/pgloader/issues/649) to all lowercase since this is the convention on postgresql (you can enable case sensitive column names in postgres but I thought it was better to stay with postgresql default settings).
* Fixed some ```rand(someSeed)``` calls to transactions with ```SET LOCAL SEED = someSeed```.
* Ported by web session handling from ```express-mysql-session``` to ```connect-pg-simple```.
* Rewrote the setup / deploy scripts to install postgres and create a new database + schema.
* Created a new blank [db-migrate](https://www.npmjs.com/package/db-migrate) seed.
* Making sure that all E2E tests were passing again. I have a very good test
  suite for this project, and it was quite amusing to see all the, sometimes
  quite unexpected, places that broke when I changed the database.

After the migration was done, I noted that:

* PostgreSQL ended up taking just 94MB of RAM memory (RSS) versus the 194MB that
  MySQL had required for the exact same data / workload (which is great because this project is deployed on a tiny Digital Ocean droplet with 1GB RAM).
* I learned that PostgreSQL doesn't support [logical column
  ordering](https://stackoverflow.com/a/50090939/5169216) yet, which kind of
  sucks.
* PostgreSQL has a TODO page that lists things that are [not implemented yet](https://wiki.postgresql.org/wiki/Todo).
* pg_dump emits SQL to lock down the search path to protect against [CVE-2018-1058](https://wiki.postgresql.org/wiki/A_Guide_to_CVE-2018-1058:_Protect_Your_Search_Path) and this ended up
causing lots of problems when I was setting up db-migrate package.

<p class="footnote"><a name="footnote1">1</a>:
Most people seem to prefer PostgreSQL, even though there are certainly examples of the <a href="https://eng.uber.com/mysql-migration/">opposite</a> for certain very specific situations.
</p>

