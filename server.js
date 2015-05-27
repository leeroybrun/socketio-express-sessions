var socketIo = require('socket.io');
var http     = require('http');
var express  = require('express');
var expressCookieParser = require('cookie-parser');
var expressSession = require('express-session');

var PORT = process.env.PORT || 8080,
    HOST = process.env.HOST || 'localhost';

// We define the key of the cookie containing the Express SID
var EXPRESS_SID_KEY = 'connect.sid';

// We define a secret string used to crypt the cookies sent by Express
var COOKIE_SECRET = 'very secret string';
var cookieParser = expressCookieParser(COOKIE_SECRET);

// Create a new store in memory for the Express sessions
var sessionStore = new expressSession.MemoryStore();

var app = express();

// Configure Express app with :
// * Cookie Parser created above
// * Configure session
app.use(cookieParser);
app.use(expressSession({
    store: sessionStore,        // We use the session store created above
    resave: false,              // Do not save back the session to the session store if it was never modified during the request
    saveUninitialized: false,   // Do not save a session that is "uninitialized" to the store
    secret: COOKIE_SECRET,      // Secret used to sign the session ID cookie. Must use the same as speficied to cookie parser
    name: EXPRESS_SID_KEY       // Custom name for the SID cookie
}));

// Configure routes
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

// Very basic login/logout routes
app.get('/login', function (req, res) {
    // We just set a session value indicating that the user is logged in
    req.session.isLogged = true;

    // Just an example to show how to get session data between Express and Socket.IO
    req.session.username = 'Hello.World';

    res.redirect('/');
});

app.get('/logout', function (req, res) {
    req.session.isLogged = false;
    delete req.session.username;

    res.redirect('/');
});

// Create HTTP server
server = http.createServer(app);

// Create Socket.io server
var io = socketIo({
    // Optional Socket.io options
});

// Socket.IO 1 is now using middlewares
// We can use this functionnality to implement authentification
io.use(function(socket, next) {
    var request = socket.request;

    if(!request.headers.cookie) {
        // If we want to refuse authentification, we pass an error to the first callback
        return next(new Error('No cookie transmitted.'));
    }

    // We use the Express cookieParser created before to parse the cookie
    // Express cookieParser(req, res, next) is used initialy to parse data in "req.headers.cookie".
    // Here our cookies are stored in "request.headers.cookie", so we just pass "request" to the first argument of function
    cookieParser(request, {}, function(parseErr) {
        if(parseErr) { return next(new Error('Error parsing cookies.')); }

        // Get the SID cookie
        var sidCookie = (request.secureCookies && request.secureCookies[EXPRESS_SID_KEY]) ||
                        (request.signedCookies && request.signedCookies[EXPRESS_SID_KEY]) ||
                        (request.cookies && request.cookies[EXPRESS_SID_KEY]);

        // Then we just need to load the session from the Express Session Store
        sessionStore.load(sidCookie, function(err, session) {
            // And last, we check if the used has a valid session and if he is logged in
            if (err) {
                return next(err);

            // Session is empty
            } else if(!session) {
                return next(new Error('Session cannot be found/loaded'));

            // Check for auth here, here is a basic example
            } else if (session.isLogged !== true) {
                return next(new Error('User not logged in'));

            // Everything is fine
            } else {
                // If you want, you can attach the session to the handshake data, so you can use it again later
                // You can access it later with "socket.request.session" and "socket.request.sessionId"
                request.session = session;
                request.sessionId = sidCookie;

                return next();
            }
        });
    });
});

// Start the socket.io server
io.listen(server);

// Upon connection, start a periodic task that emits (every 1s) the current timestamp
io.on('connection', function (socket) {

    // Just an exemple showing how to get data from the session
    // It's in the auth middleware we assigned the session data to "socket.request", we can then easily use it here
    socket.emit('welcome', 'Welcome '+ socket.request.session.username +'! Here is your SID: '+ socket.request.sessionId);

    // An example event, sending the current timestamp every 1000 milliseconds (1s)
    var sender = setInterval(function () {
        socket.emit('myCustomEvent', new Date().getTime());
    }, 1000);

    // On disconnect, clear the interval
    socket.on('disconnect', function() {
        clearInterval(sender);
    });
});

server.listen(PORT, HOST, null, function() {
    console.log('Server listening on port %d in %s mode', this.address().port, app.settings.env);
});
