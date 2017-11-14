var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(server);
var port = process.env.PORT || '8080';
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
require('dotenv').config();

require('./controllers/passport')(passport);

app.set('view-engine' , 'jade');
app.use(express.static(path.join(__dirname, 'views/styles')));
app.use(express.static(path.join(__dirname, 'views/scripts')));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

// required for passport
app.use(session({secret: process.env.SESSION_SECRET})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session


mongoose.connect(process.env.MONGO_URL, function(err){
    if(err){
      mongoose.connect('mongodb://localhost/my_datasquares', { useMongoClient: true });
    }
    console.log('Connected to squares database.');
});

//Initialize Square Model and Socket Controller
var Square = require('./models/square.js');
var Room = require('./models/room.js');
require('./controllers/sockets.js').socketController(io, Square, Room);

app.get('/', function(req,res){
    Room.findOne({name:'Main'}, function(err,room){
        if(!room){
            var mainRoom = new Room;
            mainRoom.name = "Main";
            mainRoom.owner = "sqwar";
            mainRoom.squares = [];
            mainRoom.save(function(err,thisRoom){
                res.render('index.jade' , {curUser : req.user, room : thisRoom});
            });
        }else{
            res.render('index.jade', {curUser : req.user, room : room});
        }
    });
});

app.get('/room/:name', function(req,res){
    Room.findOne({name: req.params.name}, function(err,room){
        if(!room){
            var newRoom = new Room;
            newRoom.name = req.params.name;
            newRoom.squares = [];
            newRoom.save(function(err,thisRoom){
                res.render('index.jade', {curUser : req.user, room : thisRoom});
            });
        }else{
            res.render('index.jade', {curUser : req.user, room : room});
        }
    })
});

app.get('/admin', function(req,res){
  if(req.user && req.user.username == 'sqwar'){
    Room.find({}, function(err, rooms){
      res.render('admin.jade', {curUser : req.user, rooms : rooms})
    });
  }else{
    res.send('Who do you think you are?');
  }
});

app.post('/register', passport.authenticate('local-signup', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/', // redirect to the secure profile section
        failureRedirect : '/', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
}));

app.post('/logout' , function(req,res){
    req.logout();
    res.redirect('/');
});

function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect('/');
}

server.listen(port);
