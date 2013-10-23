# Socket.IO + Express 3 sessions

The goal of this project is to demonstrate how to use Express 3 sessions in Socket.IO for authentification.

To achieve this we will store the Express sessions in a MemoryStore. We can then simply get the session ID from the client's cookies and extract the session from the MemoryStore.

There are already some examples out there on how to do that, you can found links at the end of this page.
My goal here was just to give a complete example and not to need to `require('connect')` directly in our project, as Express has it own cookie parser.

## Login process

We have a small login process, here the user just need to access the `/login` page to be logged in. He can then be logged out by accessing the `/logout` page.
In real world apps the login process will be a bit more complex, but hey, it's just a demo ;-).

The login route will just set a `loggedIn` session flag to `true`.

## Socket.IO handshake

The Socket.IO authorization handler is used to accept or reject connections to the socket server.

In fact, it's a simple HTTP call made from the client to the server. So we can get Express cookies from this call and parse them.
In these cookies we can then find the Express SID, which will be used to extract the session data from the MemoryStore.

We then just have to check if the `loggedIn` flag is set to `true` and accept the connection.
If it's not, or if the session doesn't exist, we refuse the connection to the socket server.

## Initial credits / ideas
- http://www.danielbaulig.de/socket-ioexpress/
- https://github.com/wcamarao/session.socket.io
- http://notjustburritos.tumblr.com/post/22682186189/socket-io-and-express-3
- http://howtonode.org/socket-io-auth