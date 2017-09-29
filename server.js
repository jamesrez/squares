var express = require('express');
var app = express();
var server = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(server);



app.set('view-engine' , 'jade');
app.use(express.static(path.join(__dirname, 'views/styles')));
app.use(express.static(path.join(__dirname, 'views/scripts')));

app.get('/', function(req,res){
    res.render('index.jade');
});

io.sockets.on('connection' , function(socket){

    socket.on('btnClick' , function(){
        socket.emit('btnClick');
    });

});

require('./controllers/sockets.js')(io);


server.listen(8080);
