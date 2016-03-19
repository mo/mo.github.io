---
layout: post
title:  "Introduction to AMQP and RabbitMQ"
date:   2016-03-16
tags: backend
---

RabbitMQ is a message broker that implements the [Advanced Message Queue
Protocol](https://en.wikipedia.org/wiki/Advanced_Message_Queuing_Protocol)
(AMQP). Other software can connect to an AMQP server to send and receive
messages. There are many different things that make message brokers useful:

* For example, if you're developing a web app and you need to do some heavy
processing; e.g. the user uploads a video and you want to prepare low resolution
versions of it. Doing this while processing the HTTP POST would take too long so
you do it **asynchronously** by posting a "please prepare low res versions of
this video" message to the queue instead.

* A nice side-effect is that you can implement message senders and receivers in
**different languages** (there are decent quality AMQP libaries for most
languages).

* The message broker comes with a lot of **tools** that can be used for
monitoring and administration of the queues. In the example above, if several
video conversion workers service the same queue you can monitor the queue length
and dynamically spin up new worker instances if the queue becomes too long.

* Other than the "work queue" example above, you can also run queues with
**publisher/subscriber (pubsub)** behavior so that a single message is copied
out to N subscribers. For example, if a user in a webapp hits "Delete my
account" or similar then a number of backend systems/processes could be
listening to this message and take different actions. To some extent this "loose
coupling" allows different systems/processes to communicate/cooperate without
having hardcoded references to each other.

* Finally, you can configure your queues/messages to be **persistent (on disk)**
so that a message always remains in the queue until it has been fully processed,
even if the worker or even RabbitMQ itself crashes (RabbitMQ is
implemented in Erlang where fault tolerance by being restartable is common).

It should be noted that there are several message brokers available that
implement AMQP, and there are also a bit of a split between AMQP 0.9.1 and AMQP
1.0 because the former specfies transport + model while the latter only
specifies the transport protocol (leaving the users locked-in to a specific AMQP
implementation/vendor). There is also [STOMP](https://stomp.github.io/), an
alternative wire protocol that is implemented by many brokers. At any rate, this
is certainly much better than the old JavaEE
[JMS](https://en.wikipedia.org/wiki/Java_Message_Service) which standardized the
API rather than the wire protocol, which was a really bad idea.

Even sticking to AMQP, there are a lot of different brokers to choose from and
they all differ in terms of easy-of-use, scalability and tool support etc.
ZeroMQ for example is implemented in C++ and can link as a library directly to
the sending and receiving processes, eliminating the need for a separate message
broker server. This nets you much better performance, but it's more work to get
started especially for more advanced setups that include load balancing,
persistent messages and routing.

If you need to handle a very large number of messages per second and you don't
need a lot advanced routing then you might want to look into [Apache
Kafka](http://kafka.apache.org/) as a potential alternative. If you need
millions of workers on a single machine (i.e. creating a thread per worker won't
work) you might want to build something on top of an Actor-model solution like
for example [Akka](https://www.akka.io) instead of using AMQP.

# How to setup RabbitMQ

To install RabbitMQ on a Debian/Ubuntu system do ```sudo apt-get install
rabbitmq-server```. After that, if you list the open ports using for example
```sudo netstat -tuplen``` you will see that a process called ```beam.smp``` has
opened port ```5672```; beam is the Erlang runtime and 5672 is used for non-TLS
AMQP traffic. By default, AMQP clients can login using ```guest/guest```. Even if
the socket is bound on all interfaces, the default credentials only works if you
connect from localhost. I tried to get it to bind to localhost only (both for the
AMQP port and the higher cluster port) but I ran into some issues there and I
didn't want to sink too much time into it.

Anyway, once installed you can interact with rabbitmq using the ```rabbitmqctl```
command, for example:

```
sudo rabbitmqctl list_users
sudo rabbitmqctl list_exchanges
sudo rabbitmqctl list_queues
sudo rabbitmqctl change_password USER PASS
sudo rabbitmqctl purge_queue FOO
```

It's kind of sloppy that ```sudo rabbitmqctl change_password USER``` doesn't
prompt for a password (you don't want to accidentally store it in bash history or
expose it via ```w``` on multi user systems) and instead of printing command line
usage info it actually hit SIGSEGV (not impressive!).

I suppose most people install the web based management interface anyway; this can
be done by running ```sudo rabbitmq-plugins enable rabbitmq_management```. It
opens an HTTP server on port 15672 (easy to remember since it's the AMQP port
with a "1" in front of it).

Once inside the web based management interface, click the "Admin" tab, add
a new user and put "administrator" in the tags field. After the user is created
it will be marked with "No access", to fix that just click the username and then
click the button called "Set permission" to give it access to the "/" vhost
(vhosts are similar to vhosts in apache, it allows you to run several broker
setups on a single machine so that each broker setup has its own set of queues
etc). Finally, delete the guest/guest account and create a new non-admin account
(just leave 'Tags' blank) and use this account when authenticating from
scripts/software that needs to send/receive messages.

# Sending and receiving messages

In Python, you can send and receive messages to/from RabbitMQ using a library
called Pika (on Debian/Ubuntu you can install it using ```sudo apt-get install
python-pika```, or you might prefer to use ```virtualenv``` + ```pip```).

Below are two scripts for sending and receiving messages using Pika. These
scripts are roughly similar to what you'd use to setup a work queue (pubsub
would be slightly different).

The first script posts messages to a queue. RabbitMQ tutorials and documentation
refers to such programs as "producers":

```python
#!/usr/bin/env python

import os
import sys
import pika
import logging

AMQP_PORT = 5672
QUEUE_NAME = "my_queue"
SCRIPT_PATH = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(SCRIPT_PATH, ".amqp-credentials")

def main():
    logging.basicConfig()

    (username, password) = open(CREDENTIALS_FILE).read().splitlines()
    credentials = pika.PlainCredentials(username, password)
    params = pika.ConnectionParameters('localhost', AMQP_PORT, '/', credentials)
    connection = pika.BlockingConnection(params)

    channel = connection.channel()
    channel.confirm_delivery()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    message = sys.argv[1]
    was_delivered = channel.basic_publish(
        mandatory=True,
        exchange='',
        routing_key=QUEUE_NAME,
        properties=pika.BasicProperties(delivery_mode=2),
        body=message)

    if was_delivered:
        print 'message "%s" has been delivered to queue "%s"' % (message, QUEUE_NAME)
    else:
        print "ERROR: message could not be sent!"

    channel.close()

if __name__ == '__main__':
    main()
```

The example above is pretty straight forward, but there are a couple of things
worth commenting on:

* The ```durable=True``` flag passed to ```queue_declare``` means that the queue
will remain even if the message broker is restarted (intentionally or because it
crashed). Note, however, that the actual messages in the queue will be lost
unless each message is marked as persistent (which the sender does by passing a
```properties=pika.BasicProperties(delivery_mode=2)``` parameter to
```basic_publish```).

* ```queue_declare()``` creates a queue if it doesn't exist or reuses an
existing one as long as it has the same type as the queue being declared (e.g.
whether the queue is durable or not). If the type isn't the same as the declared
queue, an exception is raised.

* The call to ```channel.confirm_delivery()``` puts the channel into confirm mode
which means that the broker will send back a confirmation once it has delivered
the message to a queue (or concluded that the message should be discarded
silently). The latter is, in fact, a common use case for pubsub where a stream
of messages are routed to N subscribers, and if N is currently zero this means
that the messages should be discarded.

* The flag ```mandatory=True``` passed to ```basic_publish``` means that
```basic_publish``` will return an error if the message could not be delivered
to at least one queue. For durable queues this means that the message will be
written to disk **before** the confirmation is sent.

* Finally, setting ```exchange=''``` instructs RabbitMQ to deliver the message
directly to the queue specified in the ```routing_key``` parameter. For pubsub
you need to create your own exchange though.

Once we've posted our message to a queue we need another script that connects
to the message broker and receives the messages (a consumer in RabbitMQ parlance):

```python
#!/usr/bin/env python

import os
import sys
import pika
import logging

AMQP_PORT = 5672
QUEUE_NAME = 'my_queue'
SCRIPT_PATH = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(SCRIPT_PATH, ".amqp-credentials")

def main():
    logging.basicConfig()

    (username, password) = open(CREDENTIALS_FILE).read().splitlines()
    credentials = pika.PlainCredentials(username, password)
    params = pika.ConnectionParameters('localhost', AMQP_PORT, '/', credentials)
    connection = pika.BlockingConnection(params)

    channel = connection.channel()

    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    def callback(ch, method, properties, body):
        print "received message: %r" % body
        ch.basic_ack(delivery_tag = method.delivery_tag)

    channel.basic_qos(prefetch_count=1)

    channel.basic_consume(callback, queue=QUEUE_NAME)
    print 'waiting for new messages on queue: ' + QUEUE_NAME
    channel.start_consuming()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        pass
```

The consumer sets up the channel and declares the queue in the exact same way as
the producer did. After that it calls ```start_consuming()``` which will block
and wait for new messages. Whenever a new message arrives, the callback passed
to ```basic_consume()``` is called.

The call to ```channel.basic_qos(prefetch_count=1)``` enables "fair dispatch"
and needs some explanation. By default RabbitMQ will assign incoming messages to
available consumers in a round robin fashion without regard to which consumers
are idle/busy. This means that some workers (consumers) might end up with a long
backlog even while other workers are idle which is quite unintuitive.

For example, a 2-worker round-robin scheduling of a workload where every odd
task is heavy and every even task is easy will become very unfair because one of
the workers will get all the easy tasks (and wont be busy that much) while the
other worker will consistency get all the heavy tasks (and will even thus become
infinitely more backlogged over time if the actual work takes longer than the
time until the next task arrives -- all while the first worker is completely idle).

The call to ```channel.basic_qos(prefetch_count=1)``` instead makes RabbitMQ not
give new work to a consumer until it has acknowledged that the consumer
completed the previous work it was assigned.

If you want to dig deeper, [rabbitmq.com](https://www.rabbitmq.com) has several
excellent tutorials available (written for multiple different programming
languages).
