var socket = io();

//Update Colors
function colorUpdate(jscolor){
  var newColor = '#'+jscolor;
  var squareId = $(jscolor.styleElement).parent().attr('id');
  $(jscolor.styleElement).parent().css('background-color' , newColor);
  socket.emit('updateSquareColor' , {color : newColor, squareId : squareId, roomName : $('#roomName').text()})
}

var zoomScale = 1.0;

var resizeToggle = false;

//Make the squares draggable
function makeDraggable(squareClass){
    if((squareClass == ".sq-" + $('#userProf').text()) || squareClass == ".squareAnon"){
        $(squareClass).draggable({
            stack : ".square",
            start: function(event, ui) {
                ui.position.left = 0;
                ui.position.top = 0;
            },
            drag : function(event, ui){
                var changeLeft = ui.position.left - ui.originalPosition.left; // find change in left
                var newLeft = ui.originalPosition.left + changeLeft / (( zoomScale)); // adjust new left by our zoomScale

                var changeTop = ui.position.top - ui.originalPosition.top; // find change in top
                var newTop = ui.originalPosition.top + changeTop / zoomScale; // adjust new top by our zoomScale

                ui.position.left = newLeft;
                ui.position.top = newTop;

                var squarePos = {top : $(this).css('top') , left : $(this).css('left')};
                var squareZ = $(this).css('z-index');
                var squareId = $(this).attr('id');
                socket.emit('updateSquarePos' , {pos : squarePos, zIndex : squareZ, squareId : squareId, roomName : $('#roomName').text()});
            }
        });
        $(squareClass).resizable({
          disabled : true,
          resize : function(event,ui){

            var changeWidth = ui.size.width - ui.originalSize.width; // find change in width
            var newWidth = ui.originalSize.width + changeWidth / zoomScale; // adjust new width by our zoomScale

            var changeHeight = ui.size.height - ui.originalSize.height; // find change in height
            var newHeight = ui.originalSize.height + changeHeight / zoomScale; // adjust new height by our zoomScale

            ui.size.width = newWidth;
            ui.size.height = newHeight;

            $(this).css('min-height' , "1px");
            //$(this).css('min-width' , "1px");
            var squareWidth = $(this).width();
            var squareHeight = $(this).height();
            var squareId = $(this).attr('id');
            socket.emit('updateSquareSize' , {width : squareWidth, height : squareHeight, squareId : squareId, roomName : $('#roomName').text()});
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

//Join Socket Room
    socket.emit('joinRoom', {roomName : $('#roomName').text()});

//Load up those squares!
    socket.emit('loadSquares', {roomName : $('#roomName').text()});
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
        autosize($('.squareTextEdit'));
        //make it functionable
        makeDraggable('.sq-'+ square.owner);
      });
    })

//Make the Anonymous Squares functionable
    makeDraggable('.squareAnon');



//Resize Squares when press R
    $(document).on("keydown", function(e){
        if(e.which == 82){
            var squareClass = ".sq-"+$('#userProf').text();
            if(resizeToggle){
                $(squareClass).resizable("option", "disabled", true);
                resizeToggle = false;
            }else{
                $(squareClass).resizable("option", "disabled", false);
                resizeToggle = true;
            }
        }
    });

//Zoom Out when press Q
    var qPressed = false;
    $(document).on("keydown", function(e){
      if(e.which == 81 && userTyping == false && qPressed == false){
        qPressed = true;
        $('.squareContainer').velocity({
          "scale" : "-=.2",
        }, 500);
        zoomScale -= 0.2;
      }
    });
    $(document).on("keyup", function(e){
      if(e.which == 81 && userTyping == false && qPressed == true){
        qPressed = false;
      }
    });

//Zoom In when press E
    var ePressed = false;
    $(document).on("keydown", function(e){
      if(e.which == 69 && userTyping == false && ePressed == false){
        ePressed = true;
        $('.squareContainer').velocity({
          "scale" : "+=.2",
        }, 500);
        zoomScale += 0.2;
      }
    });
    $(document).on("keyup", function(e){
      if(e.which == 69 && userTyping == false && ePressed == true){
        ePressed = false;
      }
    });


//WASD MOVEMENT (It just works, don't worry about it)
    box = $('.squareContainer'),
    keysPressed = {},
    distancePerIteration = 10;

    function calculateNewValue(oldValue, keyCode1, keyCode2) {
        if(!userTyping){
            var newValue = parseInt(oldValue, 10)
                           - (keysPressed[keyCode1] ? distancePerIteration : 0)
                           + (keysPressed[keyCode2] ? distancePerIteration : 0);
            return newValue;
        }
    }

    $(window).keydown(function(event) { keysPressed[event.which] = true; });
    $(window).keyup(function(event) { keysPressed[event.which] = false; });

    setInterval(function() {
        box.css({
            left: function(index ,oldValue) {
                return calculateNewValue(oldValue, 68, 65);
            },
            top: function(index, oldValue) {
                return calculateNewValue(oldValue, 83, 87);
            }
        });
    }, 20);

//When a square is moved on another client
    socket.on('updateSquarePos' , function(data){
        //Update the square's offset position
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
        $('#'+data.squareId).remove();
    });

//When you create a new square

    //Save Mouse Position
    var mouseX = 0;
    var mouseY = 0;
    $(document).mousemove(function(e){
        mouseX = e.pageX;
        mouseY = e.pageY;
    })

    //When press space
    $(document).on('keydown', function(e){
        if(e.which == 32 && userTyping == false){
            var roomName = $('#roomName').text();
            socket.emit('newSquare', {user : $('#userProf').text(), roomName : roomName, mouseX : mouseX, mouseY : mouseY});
        }
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
        newSquare.css('top', mouseY - 50);
        newSquare.css('left', mouseX - 50);
        autosize($('.squareTextEdit'));
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
      if(e.which == 70 && userTyping == false){
        var squareClass = ".sq-" + $('#userProf').text();
        $(squareClass).css('box-shadow' , '0px 0px 5px red');
        $('.squareAnon').css('box-shadow' , '0px 0px 5px red');
        deleteMode = true;
      }
    });
    $(document).on("keyup", function(e){
      if(e.which == 70){
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
        var squareId = $(this).attr('id');
        var roomName = $('#roomName').text();
        socket.emit('deleteSquare' , {squareId : squareId, roomName : roomName});
      }
  });


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
      socket.emit('updateSquareText' , {text : squareTextEditValue, squareId : squareId, roomName : $('#roomName').text()});
    });

    autosize($('.squareTextEdit'));

//Making and Going to ROOMS
    $('.roomInputBtn').click(function(){
        var roomInput = ($('#roomInput').val()) ? $('#roomInput').val() : 'Main';
        window.location = ('/room/'+roomInput);
    });

//Hiding the hints
    var showHints = true
    $(document).on("keydown", function(e){
        if(e.which == 72){
            if(showHints){
                $('.hintsContainer').css('display', 'none');
                showHints = false;
            }else{
                $('.hintsContainer').css('display', 'block');    
                showHints = true;
            }
        }
    })

//USER AUTHENITCATION

    $('input').focus(function(){
        userTyping = true;
    });
    $('input').blur(function(){
        userTyping = false;
    });

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
