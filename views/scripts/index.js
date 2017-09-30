
$(document).ready(function(){
    var socket = io();

    $('.square').draggable({
        stack : ".square",
        drag : function(event, ui){
            var squarePos = $(this).offset();
            var squareId = $(this).attr('id');
            socket.emit('updateSquarePos' , {pos : squarePos, id : squareId});
        }
    });

    socket.on('updateSquarePos' , function(data){
        $('#'+data.id).offset(data.pos);
    });

    $('#newSquareBtn').click(function(){
        socket.emit('newSquare', {user : $('#userProf').text()});
    });

    socket.on('newSquare' , function(data){
        $('#square1').clone().addClass("sq-"+data.user).appendTo('.squareContainer');
    })


    //USER AUTHENITCATION
    $('#register').click(function(){
        $.post('/register', {email : $('#email').val() , password : $('#password').val()}, function(){
            location.reload();
        });
    });

    $('#login').click(function(){
        $.post('/login', {email : $('#email').val() , password : $('#password').val()}, function(){
            location.reload();
        });
    });

    $('#logout').click(function(){
        $.post('/logout', function(req,res){
            location.reload();
        });
    })

});
