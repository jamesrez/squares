var socket = io();

//Update Colors
function colorUpdate(jscolor){
  var newColor = '#'+jscolor;
  var squareId = '#' + $(jscolor.styleElement).parent().attr('id');
  $(jscolor.styleElement).parent().css('background-color' , newColor);
  socket.emit('updateSquareColor' , {color : newColor, id : squareId})
}

//Make the squares draggable
function makeDraggable(squareClass){
    if((squareClass == ".sq-" + $('#userProf').text()) || squareClass == ".squareAnon"){
        $(squareClass).draggable({
            stack : ".square",
            drag : function(event, ui){
                var squarePos = $(this).offset();
                var squareId = $(this).attr('id');
                socket.emit('updateSquarePos' , {pos : squarePos, id : squareId});
            }
        });
        $(squareClass).resizable({
          resize : function(event,ui){
            var squareWidth = $(this).width();
            var squareHeight = $(this).height();
            var squareId = $(this).attr('id');
            socket.emit('updateSquareSize' , {width : squareWidth, height :squareHeight, id:squareId});
          }
        });
    }
}

function getUserSqCount(userEmail){
    var className = ".sq-"+userEmail;
    if(!$(className)){
        return 0;
    }else{
        return $(className).length;
    }
}


$(document).ready(function(){

    makeDraggable('.squareAnon');

    //When a square is moved on another client
    socket.on('updateSquarePos' , function(data){
        //Update the square's offset position
        $('#'+data.id).offset(data.pos);
    });

    //When a square is resized on another client
    socket.on('updateSquareSize' , function(data){
        $('#'+data.id).width(data.width);
        $('#'+data.id).height(data.height);
    });

    //When a square is recolored on another client
    socket.on('updateSquareColor' , function(data){
        $(data.id).css('background-color' , data.color);
    });

    //When you create a new square
    $('#newSquareBtn').click(function(){
        //Send username to server
        socket.emit('newSquare', {user : $('#userProf').text()});
    });
    //When a client makes a new square
    socket.on('newSquare' , function(data){
        //Create a unique square id and create a new square
        var userSqCount = getUserSqCount(data.user);
        var newClass = "sq-"+data.user;
        var newId = "sq-" + data.user + "-" + userSqCount;
        var newSquare = $('.squarePrototype').clone().attr('id' , newId).addClass(newClass).addClass('square').css('display','flex').appendTo('.squareContainer');
        newSquare.removeClass('squarePrototype')
        makeDraggable('.'+ newClass);
    })

    //Color When Press C
    $(document).on("keydown", function(e){
      if(e.which == 67){
        $('.color').css('display' , 'block');
      }
    });
    $(document).on("keyup", function(e){
      if(e.which == 67){
        $('.color').css('display' , 'none');
      }
    });

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
