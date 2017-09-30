module.exports = function(io){
    io.on('connection' , function(socket){


        socket.on('updateSquarePos' , function(data){
            socket.broadcast.emit('updateSquarePos', {pos : data.pos, id : data.id});
        });

        socket.on('newSquare', function(data){
            io.sockets.emit('newSquare' , {user : data.user})
        });


    });
}
