---
layout: post
title:  "MongoDB: Install and enable authentication"
date:   2016-12-31
tags:   backend
---

This blog post explains how to install and run a local development install of
MongoDB. It also covers how to enable authentication, which sadly isn't enabled
by default. It describes how to install a distro neutral non-packaged version of
MongoDB where you download a tarball and run it from a separate directory.

The upstream MongoDB project also offers packaged versions for various distros,
for example the guide at
[Ubuntu](https://docs.mongodb.com/manual/tutorial/install- mongodb-on-ubuntu/)
helps you drop ```repo.mongodb.org/apt``` into ```sources.list.d``` etc so that
```sudo service mongod start``` works and the mongod configuration file lives in
```/etc/mongod.conf```. Finally, you can of course also install the
```mongodb``` package from Debian/Ubuntu ```universe``` (or similar on other
distros) but then you're likely not getting the latest version so it's a good
idea to read up on what you're missing (for example, some earlier MongoDB
versions had per-collection locking instead of per-document locking).

Note that this post only covers a basic local development installation, for real
deployments you most likely need sharding and TLS etc.

# Step 1: Fetch the right tarball from mongodb.com

Download the right version of the MongoDB tarball. Unpack it (to ```~/opt``` or
```/opt``` or wherever you usually put non-package software) and then try
running ```./bin/mongod --help``` to see that it properly finds the dynamically
linked OpenSSL.

For example, the Amazon Linux version of MongoDB has OpenSSL linked to the
**specific** version that ships on the Amazon Linux AMI, so if you spawn an
Ubuntu AMI on AWS and try to run the Amazon Linux AMI you'd get an error like:

```
/usr/lib/libcrypto.so.10: version `libcrypto.so.10' not found (required by ./mongod)
/usr/lib/libssl.so.10: version `libssl.so.10' not found (required by ./mongod)
```

# Step 2: Create and chmod a data directory

By default MongoDB stores data in ```/data/db``` but you can use another data
directory by passing a ```--dbpath ~/mongo-data``` or similar argument to
```mongod```. In both cases the data directory should be chmod'ed so that it is
readable by the user account that will run ```mongod``` (and most likely
readable only by that account as well, depending on your preferences). You
should definitely not run ```mongod``` as root.

# Step 3: Use &ndash;&ndash;bind_ip to safely enable authentication

When you start ```mongod``` it will, by default, listen on all local IP
addresses (all interfaces, not just localhost!) and it will run with no
authentication enabled (needless to say, this is a pretty dangerous default).
For example, if you just spawned a Digital Ocean droplet with a pristine Ubuntu
installation, there won't be a firewall active and the whole internet can freely
login and create database administrator accounts for themselves on your MongoDB
server. For AWS, there might be a security group that blocks inbound traffic on
ports other than 22 (or whatever has been explicitly opened) but it's a good
habit to always launch with ```--bind_ip 127.0.0.1``` the first time you launch
```mongod``` (i.e. before you've enabled authentication). Also in many cases,
like local development installations, you can and should continue to run with
```--bind_ip 127.0.0.1``` even after authentication is enabled.

To enable authentication:

* Start MongoDB using ```./bin/mongod --dbpath ~/mongo-data --bind_ip 127.0.0.1```
* Create an administrator user called ```bofh``` with password ```fu```, by running:

```js
use admin
db.createUser({user:"bofh", pwd:"fu", roles:[{role:"root", db:"admin"}]})
```

* Finally, restart ```mongod``` with the ```--auth``` command line argument.

Of course, at this point you might want to both enable authentication and also
set the bind IP in a **config file** instead of passing a bunch of command line
arguments on every launch.

# Step 4: Verify that the account works

You should now be able to login to the above account using:

```
./mongo -u SOME_USERNAME -p --authenticationDatabase admin
```

This will prompt you for the password interactively. Technically, mongo shell
allows you to pass the password itself as an argument (i.e. ```-p
SOME_PASSWORD```) but this should be avoided because you don't want all your
passwords stored in ```~/.bash_history``` where they could leak via a sloppy
umask or backup job.

# Step 5: Optionally create auxiliary lower privilege accounts

If you have some reporting / statistics gathering utility that can run with read
only access to a particular database you can create a separate account with such
rights by logging in as an administrator and then running:

```js
use admin
db.createUser({user:"ro", pwd:"123", roles:[{role:"read", db:"someDatabase"}]})
```
