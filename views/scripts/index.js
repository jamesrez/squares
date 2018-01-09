var socket = io();

//Update Colors
function colorUpdate(jscolor){
  var newColor = '#'+jscolor;
  var squareId = $(jscolor.styleElement).parent().attr('id');
  $(jscolor.styleElement).parent().css('background-color' , newColor);
  socket.emit('updateSquareColor' , {color : newColor, squareId : squareId, roomName : $('#roomName').text()})
}

var zoomScale = 1.0;
var zoomOffset = 50;

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

            var squareImgHeight = 0.80 * squareHeight;
            var squareImgWidth = 0.80 * squareWidth;

            if($(this).children('.squareImg').attr('src')){
              $(this).children('.squareImg').height(squareImgHeight);
              $(this).children('.squareImg').width(squareImgWidth);
            }

            var squareId = $(this).attr('id');
            socket.emit('updateSquareSize' , {width : squareWidth, height : squareHeight, imageWidth : squareImgWidth, imageHeight : squareImgHeight, squareId : squareId, roomName : $('#roomName').text()});
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
        loadedSquare.css('min-height' , "1px");
        loadedSquare.width(square.width);
        loadedSquare.height(square.height);
        //Load the square's color
        loadedSquare.css('background-color' , square.color);
        //Load the square's text
        loadedSquare.children('.squareText').text(square.text);
        if(square.imageSrc){
          loadedSquare.children('.squareImg').attr('src', square.imageSrc);
          loadedSquare.children('.squareImg').height(0.8 * square.height);
          loadedSquare.children('.squareImg').width(0.8 * square.width);
          if(square.hide){
            loadedSquare.css('background-color', 'rgba(0,0,0,0)');
            loadedSquare.css('border', '0px solid black');
          }
        }
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
          "scale" : "/=1.2",
        }, 500);
        zoomScale /= 1.2;
        zoomOffset /= 1.2;
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
          "scale" : "*=1.2",
        }, 500);
        zoomScale *= 1.2;
        zoomOffset *= 1.2;
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
        mouseX = calculateNewValue(mouseX, 65, 68);
        mouseY = calculateNewValue(mouseY, 87, 83);

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
        if($('#' + data.squareId).children('.squareImg').attr('src')){
          $('#'+data.squareId).children('.squareImg').width(data.imageWidth);
          $('#'+data.squareId).children('.squareImg').height(data.imageHeight);
        }
    });

//When a square is recolored on another client
    socket.on('updateSquareColor' , function(data){
        $('#'+data.squareId).css('background-color' , data.color);
    });

//When a square is retyped on another client
    socket.on('updateSquareText' , function(data){
        $('#'+data.squareId).children('.squareText').text(data.text);
    });

//When a square gets an image on another client
    socket.on('updateSquareImage' , function(data){
        $('#'+data.squareId).children('.squareImg').attr('src', data.imageSrc);
        $('#'+data.squareId).children('.squareImg').height(0.8 * $('#'+data.squareId).height());
        $('#'+data.squareId).children('.squareImg').width(0.8 * $('#'+data.squareId).width());
        if(data.hideSquare){
          $('#'+data.squareId).css('background-color', 'rgba(0,0,0,0)');
          $('#'+data.squareId).css('border', '0px solid black');
        }
    });

//When a square is deleted on another client
    socket.on('deleteSquare' , function(data){
        $('#'+data.squareId).remove();
    });

//When the Room Squares are deleted
    socket.on('deleteAllSquares', function(data){
        $('.square').remove();
    });

//When you create a new square

    //Save Mouse Position
    var mouseX = 0;
    var mouseY = 0;
    $(document).mousemove(function(e){
        var bodyOffsets = document.body.getBoundingClientRect();
        mouseX = ((e.pageX - $('.squareContainer').offset().left - zoomOffset) / zoomScale);
        mouseY = ((e.pageY - $('.squareContainer').offset().top - zoomOffset) / zoomScale);
    });

    //When press space
    var spam = false;
    $(document).on('keydown', function(e){
        if(e.which == 32 && userTyping == false){
          e.preventDefault();
          if(userTyping == false && $('#userProf').text() && !spam){
              var roomName = $('#roomName').text();
              socket.emit('newSquare', {user : $('#userProf').text(), roomName : roomName, mouseX : mouseX, mouseY : mouseY});
              spam = true;
              setTimeout(function(){
                spam = false;
              }, 2000);
            }
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
        newSquare.css('top', data.pos.top);
        newSquare.css('left', data.pos.left);
        newSquare.attr('id' , newId).addClass(newClass).addClass('square').css('display','flex').appendTo('.squareContainer');
        newSquare.removeClass('squarePrototype');
        newSquare.css('min-height' , "1px");
        newSquare.css({width : '100px', height : '100px'});
        newSquare.css('z-index' , 9000)
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

  //IMAGES
    //Image Edit and Button When Press I
    var showImageEdit = false;
    $(document).on("keydown", function(e){
        if(e.which == 73 && userTyping == false){
          var squareClass = ".sq-" + $('#userProf').text();
            if(showImageEdit){
                $(squareClass).children('.imgForm', '.imgForm2').css('display', 'none');
                // $(squareClass).children('.imgEdit').css('display', 'none');
                // $(squareClass).children('.imgEditBtn').css('display', 'none');
                // $(squareClass).children('.squareShow').css('display', 'none');
                // $(squareClass).children('.squareShowLabel').css('display', 'none');
                showImageEdit = false;
            }else{
                $(squareClass).children('.imgForm', '.imgForm2').css('display', 'flex');
                // $(squareClass).children('.imgEdit').css('display', 'block');
                // $(squareClass).children('.imgEditBtn').css('display', 'block');
                // $(squareClass).children('.squareShow').css('display', 'block');
                // $(squareClass).children('.squareShowLabel').css('display', 'block');
                showImageEdit = true;
            }
        }
    });
    $('.imgEditBtn').click(function(){
      var thisSquare = $(this).parent();
      thisSquare.children('.squareImg').height(0.8 * thisSquare.height());
      thisSquare.children('.squareImg').width(0.8 * thisSquare.width());
      thisSquare.children('.squareImg').attr('src', thisSquare.children('.imgEdit').val());
      var squareClass = ".sq-" + $('#userProf').text();
      $(squareClass).children('.imgEdit').css('display', 'none');
      $(squareClass).children('.imgEditBtn').css('display', 'none');
      $(squareClass).children('.squareShow').css('display', 'none');
      $(squareClass).children('.squareShowLabel').css('display', 'none');
      showImageEdit = false;
      var hideSquare = thisSquare.children('.squareShow').is(":checked");
      if(hideSquare){
        thisSquare.css('background-color', 'rgba(0,0,0,0)');
        thisSquare.css('border', '0px solid black');
      }
      socket.emit('updateSquareImage', {imageSrc : thisSquare.children('.imgEdit').val(), squareId : thisSquare.attr('id'), roomName : $('#roomName').text(), hideSquare : hideSquare});
    });

//Delete When Press F
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
      if(deleteMode && ($(this).hasClass("sq-" + $('#userProf').text()) || $(this).hasClass("squareAnon") || $('#userProf').text() == 'sqwar')){
        $(this).remove();
        var squareId = $(this).attr('id');
        var roomName = $('#roomName').text();
        socket.emit('deleteSquare' , {squareId : squareId, roomName : roomName, username : $('#userProf').text()});
      }
  });

  //Press X to Hide Other Squares that are not yours
  var hideOtherSquares = true;
  $(document).on("keydown", function(e){
      if(e.which == 88 && userTyping == false){
        var userSquareClass = ".sq-" + $('#userProf').text();
          if(hideOtherSquares){
              $(".square").not(userSquareClass).css('display', 'none');
              hideOtherSquares = false;
          }else{
              $(".square").not(userSquareClass).css('display', 'flex');
              hideOtherSquares = true;
          }
      }
  });


//Typing when DoubleClick
    var currentEditSquare = false;
    $(document).on("dblclick" , ".square" , function(){
      if($(this).hasClass("sq-" + $('#userProf').text()) || $(this).hasClass("squareAnon")){
        var squareText = $(this).find('.squareText');
        var squareTextEdit = $(this).find('.squareTextEdit').css('display' , 'block').val(squareText.text());
        var squareTextSize = $(this).find('.squareTextSize').css('display' , 'block');
        squareText.css('display' , 'none');
        squareTextEdit.focus();
        userTyping = true;
        currentEditSquare = $(this);
      }
    });
    $('html').click(function(e){
      if(e.target.class != '.squareTextForm' && $(e.target).parents('.squareTextForm').length == 0 && currentEditSquare) {
        userTyping = false;
        editMode = false;
        var squareTextEditValue = currentEditSquare.find('.squareTextEdit').val();
        var squareText = currentEditSquare.find('.squareText');
        squareText.css('display' , 'inline-block').text(squareTextEditValue);
        currentEditSquare.find('.squareTextEdit').css('display' , 'none');
        currentEditSquare.find('.squareTextSize').css('display' , 'none');
        var squareId = currentEditSquare.attr('id');
        currentEditSquare = false;
        socket.emit('updateSquareText' , {text : squareTextEditValue, squareId : squareId, roomName : $('#roomName').text()});
      }
    });
    //FONT SIZE
    $('.squareTextSize').blur(function(e){
      if($(this).val() > 75){
        $(this).val(75);
      }else if($(this).val() < 5){
        $(this).val(5);
      }
      currentEditSquare.find('.squareTextEdit').css('font-size', $(this).val() + 'px');
      currentEditSquare.find('.squareText').css('font-size', $(this).val() + 'px');
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
        if(e.which == 72 && !userTyping){
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
