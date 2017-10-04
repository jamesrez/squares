module.exports = function(io){
    io.on('connection' , function(socket){


        socket.on('updateSquarePos' , function(data){
            socket.broadcast.emit('updateSquarePos', {pos : data.pos, id : data.id});
        });

        socket.on('updateSquareSize' , function(data){
            socket.broadcast.emit('updateSquareSize', {width : data.width, height : data.height, id : data.id});
        });

        socket.on('updateSquareColor' , function(data){
            socket.broadcast.emit('updateSquareColor' , {color : data.color, id : data.id});
        });

        socket.on('newSquare', function(data){
            io.sockets.emit('newSquare' , {user : data.user})
        });


    });
}
