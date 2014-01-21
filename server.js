var io      = require('socket.io'),
    http    = require('http'),
    express = require('express');

var PORT = process.env.PORT || 8080,
    HOST = process.env.HOST || 'localhost';

// We define the key of the cookie containing the Express SID
var EXPRESS_SID_KEY = 'express.sid';

// We define a secret string used to crypt the cookies sent by Express
var COOKIE_SECRET = 'very secret string';
var cookieParser = express.cookieParser(COOKIE_SECRET);

// Create a new store in memory for the Express sessions
var sessionStore = new express.session.MemoryStore();

var app = express();

// Configure Express app with :
// * Cookie Parser created above
// * Configure Session Store
app.configure(function () {
    app.use(cookieParser);
    app.use(express.session({
        store: sessionStore,
        cookie: { 
            httpOnly: true
        },
        key: EXPRESS_SID_KEY
    }));
});

// Configture routes
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/views/index.html');
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

// Create HTTP server, register socket.io as listener
server = http.createServer(app);
io = io.listen(server);

// We configure the socket.io authorization handler (handshake)
io.set('authorization', function (data, callback) {
    if(!data.headers.cookie) {
        return callback('No cookie transmitted.', false);
    }

    // We use the Express cookieParser created before to parse the cookie
    // Express cookieParser(req, res, next) is used initialy to parse data in "req.headers.cookie".
    // Here our cookies are stored in "data.headers.cookie", so we just pass "data" to the first argument of function
    cookieParser(data, {}, function(parseErr) {
        if(parseErr) { return callback('Error parsing cookies.', false); }

        // Get the SID cookie
        var sidCookie = (data.secureCookies && data.secureCookies[EXPRESS_SID_KEY]) ||
                        (data.signedCookies && data.signedCookies[EXPRESS_SID_KEY]) ||
                        (data.cookies && data.cookies[EXPRESS_SID_KEY]);

        // Then we just need to load the session from the Express Session Store
        sessionStore.load(sidCookie, function(err, session) {
            // And last, we check if the used has a valid session and if he is logged in
            if (err || !session || session.isLogged !== true) {
                callback('Not logged in.', false);
            } else {
                // If you want, you can attach the session to the handshake data, so you can use it again later
                data.session = session;

                callback(null, true);
            }
        });
    });
});

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
