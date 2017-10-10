var socket = io();

//Update Colors
function colorUpdate(jscolor){
  var newColor = '#'+jscolor;
  var squareId = $(jscolor.styleElement).parent().attr('id');
  $(jscolor.styleElement).parent().css('background-color' , newColor);
  socket.emit('updateSquareColor' , {color : newColor, squareId : squareId})
}

//Make the squares draggable
function makeDraggable(squareClass){
    if((squareClass == ".sq-" + $('#userProf').text()) || squareClass == ".squareAnon"){
        $(squareClass).draggable({
            stack : ".square",
            drag : function(event, ui){
                var squarePos = {top : $(this).css('top') , left : $(this).css('left')};
                var squareZ = $(this).css('z-index');
                var squareId = $(this).attr('id');
                socket.emit('updateSquarePos' , {pos : squarePos, zIndex : squareZ, squareId : squareId});
            }
        });
        $(squareClass).resizable({
          resize : function(event,ui){
            $(this).css('min-height' , "1px");
            //$(this).css('min-width' , "1px");
            var squareWidth = $(this).width();
            var squareHeight = $(this).height();
            var squareId = $(this).attr('id');
            socket.emit('updateSquareSize' , {width : squareWidth, height : squareHeight, squareId : squareId});
          }
        });
        jscolor.installByClassName("jscolor");
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
    //Booleans
    var userTyping = false;
    var deleteMode = false

    //Load up those squares!
    socket.emit('loadSquares');
    socket.on('loadSquares' , function(data){
      //For each square in room
      data.squares.forEach(function(square){
        //Clone the prototype
        var loadedSquare = $('.squarePrototype').clone(true);
        //Add the squareid and owner + update Css + add to container
        loadedSquare.attr('id' , square._id).addClass('sq-'+square.owner).addClass('square').css('display','flex').appendTo('.squareContainer');
        loadedSquare.removeClass('squarePrototype');
        //Load position
        loadedSquare.css('top' , square.pos.top);
        loadedSquare.css('left' , square.pos.left);
        //Load the square's zIndex
        loadedSquare.css('z-index' , square.zIndex);
        //Load the square's size
        loadedSquare.width(square.width);
        loadedSquare.height(square.height);
        //Load the square's color
        loadedSquare.css('background-color' , square.color);
        //Load the square's text
        loadedSquare.children('.squareText').text(square.text);
        //make it functionable
        makeDraggable('.sq-'+ square.owner);
      });
    })

    //Make the Anonymous Squares functionable
    makeDraggable('.squareAnon');

    //When a square is moved on another client
    socket.on('updateSquarePos' , function(data){
        //Update the square's offset position
        console.log(data);
        $('#'+data.squareId).css('top' , data.pos.top);
        $('#'+data.squareId).css('left' , data.pos.left);
        //Update the square's zIndex
        $('#'+data.squareId).css('z-index' , data.zIndex);
    });

    //When a square is resized on another client
    socket.on('updateSquareSize' , function(data){
        $('#'+data.squareId).width(data.width);
        $('#'+data.squareId).height(data.height);
    });

    //When a square is recolored on another client
    socket.on('updateSquareColor' , function(data){
        $('#'+data.squareId).css('background-color' , data.color);
    });

    //When a square is retyped on another client
    socket.on('updateSquareText' , function(data){
        $('#'+data.squareId).children('.squareText').text(data.text);
    });

    //When a square is deleted on another client
    socket.on('deleteSquare' , function(data){
        $(data.squareId).remove();
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
        //add owner name to class
        var newClass = "sq-"+data.user;
        //add mongoose model id to client attribute id
        var newId = data.squareId;
        var newSquare = $('.squarePrototype').clone(true);
        newSquare.attr('id' , newId).addClass(newClass).addClass('square').css('display','flex').appendTo('.squareContainer');
        newSquare.removeClass('squarePrototype');
        makeDraggable('.'+ newClass);
    })

    //Color When Press C
    $(document).on("keydown", function(e){
      if(e.which == 67 && userTyping == false){
        var squareClass = ".sq-" + $('#userProf').text();
        $(squareClass).children('.color').css('display' , 'block');
        $('.squareAnon').children('.color').css('display' , 'block');
      }
    });
    $(document).on("keyup", function(e){
      if(e.which == 67){
        var squareClass = ".sq-"+$('#userProf').text();
        $(squareClass).children('.color').css('display' , 'none');
        $('.squareAnon').children('.color').css('display' , 'none');
      }
    });

    //Delete When Press D
    $(document).on("keydown", function(e){
      if(e.which == 68 && userTyping == false){
        var squareClass = ".sq-" + $('#userProf').text();
        $(squareClass).css('box-shadow' , '0px 0px 5px red');
        $('.squareAnon').css('box-shadow' , '0px 0px 5px red');
        deleteMode = true;
      }
    });
    $(document).on("keyup", function(e){
      if(e.which == 68){
        var squareClass = ".sq-"+$('#userProf').text();
        $(squareClass).css('box-shadow' , '0px 0px 0px');
        $('.squareAnon').css('box-shadow' , '0px 0px 0px');
        deleteMode = false;
      }
    });
    $(document).on('click' , '.square', function(){
      //Holding down D and its an anon or user square
      if(deleteMode && ($(this).hasClass("sq-" + $('#userProf').text()) || $(this).hasClass("squareAnon"))){
        $(this).remove();
        var squareId = '#'+$(this).attr('id');
        socket.emit('deleteSquare' , {squareId : squareId})
      }
    })


    //Typing when DoubleClick
    $(document).on("dblclick" , ".square" , function(){
      if($(this).hasClass("sq-" + $('#userProf').text()) || $(this).hasClass("squareAnon")){
        var squareText = $(this).children('p');
        var squareTextEdit = $(this).children('textarea').css('display' , 'block').val(squareText.text());
        squareText.css('display' , 'none');
        squareTextEdit.focus();
        userTyping = true;
      }
    });
    $('.squareTextEdit').blur(function(){
      userTyping = false;
      var squareTextEditValue = $(this).val();
      var squareText = $(this).parent().children('p');
      squareText.css('display' , 'inline-block').text(squareTextEditValue);
      $(this).css('display' , 'none');
      var squareId = squareText.parent().attr('id');
      socket.emit('updateSquareText' , {text : squareTextEditValue, squareId : squareId});
    });

    autosize($('.squareTextEdit'));


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
