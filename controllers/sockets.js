module.exports = function(io, Square){
    io.on('connection' , function(socket){

        socket.on('loadSquares' , function(){
          Square.find({}, function(err, squares){
            socket.emit('loadSquares' , {squares : squares});
          });
        });

        socket.on('updateSquarePos' , function(data){
          socket.broadcast.emit('updateSquarePos', {pos : data.pos, zIndex : data.zIndex, squareId : data.squareId});
          Square.findById(data.squareId, function(err, thisSquare){
            thisSquare.pos = data.pos;
            thisSquare.zIndex = data.zIndex;
            thisSquare.save();
          });
        });

        socket.on('updateSquareSize' , function(data){
          socket.broadcast.emit('updateSquareSize', {width : data.width, height : data.height, squareId : data.squareId});
          Square.findById(data.squareId, function(err, thisSquare){
            thisSquare.width = data.width;
            thisSquare.height = data.height;
            thisSquare.save();
          });
        });

        socket.on('updateSquareColor' , function(data){
          socket.broadcast.emit('updateSquareColor' , {color : data.color, squareId : data.squareId});
          Square.findById(data.squareId, function(err, thisSquare){
            thisSquare.color = data.color;
            thisSquare.save();
          });
        });

        socket.on('updateSquareText' , function(data){
          socket.broadcast.emit('updateSquareText' , {text : data.text , squareId : data.squareId});
          Square.findById(data.squareId, function(err, thisSquare){
            thisSquare.text = data.text;
            thisSquare.save();
          });
        });

        socket.on('newSquare', function(data){
          var newSquare = new Square;
          newSquare.owner = data.user;
          newSquare.save(function(err, thisSquare){
            io.sockets.emit('newSquare' , {user : data.user, squareId : thisSquare._id});
          });
        });

        socket.on('deleteSquare' , function(data){
          socket.broadcast.emit('deleteSquare', {squareId : data.squareId});
          Square.findByIdAndRemove(data.squareId, function(err){
            if(err) console.log(err);
          });
        });


    });
}
