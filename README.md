# Socket.IO 1 + Express 4 sessions

[**Click here for the Express 3 & Socket.IO 0.9 example**](https://github.com/leeroybrun/socketio-express-sessions/tree/socketio0.9-express3)

The goal of this project is to demonstrate how to use Express 4 sessions in Socket.IO 1 for authentification.

To achieve this we will store the Express sessions in a MemoryStore (not suitable for production, but you can use any other session store the same way).  
We can then simply get the session ID from the client's cookies and extract the session from the MemoryStore.

There are already some examples out there on how to do that, you can find links at the end of this page.
My goal was just to give a complete example and not needing to `require('connect')` directly in our project, as Express has it own cookie parser.

## Screen

[![Screen](https://raw.github.com/leeroybrun/socketio-express-sessions/master/screen.jpg)](https://raw.github.com/leeroybrun/socketio-express-sessions/master/screen.jpg)

## Login process

We have a small login process, here the user just need to access the `/login` page to be logged in.  
He can then be logged out by accessing the `/logout` page.
In real world apps the login process will be a bit more complex, but hey, it's just an example ;-).

The login route will just set a `loggedIn` session flag to `true` and a `username`.

## Socket.IO handshake

Socket.IO 1 is now using middlewares, so we can easily implement a simple middleware to handle auth.

In this middleware, we will :

1. Parse cookies from the request
2. Get the session ID from the right cookie
3. Then we will load the session associated with this given SID from the session store
4. Now we can check if the user is logged in (here it's just a `session.isLogged === true` check)
5. If the user is logged in, we just call the `next` callback of the middleware (with no arguments)
6. If an error occurs during this process (no cookie, user not logged in, etc), we pass an error object to the first argument of the `next` callback

When the user is detected as logged in, we can even attach some session data to the socket.request object.  
This way, the session data attached will be available later (connection, events, etc).

## Initial credits / ideas
- http://www.danielbaulig.de/socket-ioexpress/
- https://github.com/wcamarao/session.socket.io
- http://notjustburritos.tumblr.com/post/22682186189/socket-io-and-express-3
- http://howtonode.org/socket-io-auth

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/leeroybrun/socketio-express-sessions/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
