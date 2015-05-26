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
// * Configure Session Store
app.use(cookieParser);
app.use(expressSession({
    store: sessionStore,
    cookie: { 
        httpOnly: true
    },
    resave: false,
    saveUninitialized: false,
    secret: COOKIE_SECRET,
    name: EXPRESS_SID_KEY
}));

// Configure routes
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

// Very basic login/logout routes
app.get('/login', function (req, res) {
    // We just set a session value indicating that the user is logged in
    req.session.isLogged = true;
    res.redirect('/');
});
app.get('/logout', function (req, res) {
    req.session.isLogged = false;
    res.redirect('/');
});

// Create HTTP server
server = http.createServer(app);

// Create Socket.io server
var io = socketIo({
    // Optional Socket.io options
});

io.use(function(socket, next) {
    var data = socket.request;

    console.log(data);

    if(!data.headers.cookie) {
        return next(new Error('No cookie transmitted.'));
    }

    // We use the Express cookieParser created before to parse the cookie
    // Express cookieParser(req, res, next) is used initialy to parse data in "req.headers.cookie".
    // Here our cookies are stored in "data.headers.cookie", so we just pass "data" to the first argument of function
    cookieParser(data, {}, function(parseErr) {
        if(parseErr) { return next(new Error('Error parsing cookies.')); }

        // Get the SID cookie
        var sidCookie = (data.secureCookies && data.secureCookies[EXPRESS_SID_KEY]) ||
                        (data.signedCookies && data.signedCookies[EXPRESS_SID_KEY]) ||
                        (data.cookies && data.cookies[EXPRESS_SID_KEY]);

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
                // You can access it later with "socket.request.session"
                data.session = session;
                data.sessionId = sidCookie;

                return next();
            }
        });
    });
});

// 
io.listen(server);

// upon connection, start a periodic task that emits (every 1s) the current timestamp
io.on('connection', function (socket) {
    var sender = setInterval(function () {
        socket.emit('myCustomEvent', new Date().getTime());
    }, 1000);

    socket.on('disconnect', function() {
        clearInterval(sender);
    });
});

server.listen(PORT, HOST, null, function() {
    console.log('Server listening on port %d in %s mode', this.address().port, app.settings.env);
});
