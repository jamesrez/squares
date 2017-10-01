var socket = io();

function makeDraggable(){
    $('.square').draggable({
        stack : ".square",
        drag : function(event, ui){
            var squarePos = $(this).offset();
            var squareId = $(this).attr('id');
            socket.emit('updateSquarePos' , {pos : squarePos, id : squareId});
        }
    });
}

function getUserSqCount(userEmail){
    var className = ".sq-"+userEmail;
    console.log($(className).length);
    if(!$(className)){
        return 0;
    }else{
        return $(className).length;
    }
}


$(document).ready(function(){

    makeDraggable();


    socket.on('updateSquarePos' , function(data){
        $('#'+data.id).offset(data.pos);
    });

    $('#newSquareBtn').click(function(){
        socket.emit('newSquare', {user : $('#userProf').val()});
    });

    socket.on('newSquare' , function(data){
        var userSqCount = getUserSqCount(data.user);
        var newId = "sq-" + data.user + "-" + userSqCount;
        $('#square1').clone().attr('id' , newId).addClass("sq-"+data.user).appendTo('.squareContainer');
        makeDraggable();
    })


    //USER AUTHENITCATION
    $('#register').click(function(){
        $.post('/register', {username : $('#username').val() , password : $('#password').val()}, function(){
            location.reload();
        });
    });

    $('#login').click(function(){
        $.post('/login', {username : $('#username').val() , password : $('#password').val()}, function(){
            location.reload();
        });
    });

    $('#logout').click(function(){
        $.post('/logout', function(req,res){
            location.reload();
        });
    })

});
