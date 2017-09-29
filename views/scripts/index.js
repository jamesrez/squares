
$(document).ready(function(){
    var socket = io();

    $('.square').draggable({
        stack : ".square"
    });

    $('.btn').click(function(){
        socket.emit('btnClick');
    })



    socket.on('btnClick' , function(data){
        console.log("Something");
        $(".square").clone().appendTo(".squareContainer");
    });


});
