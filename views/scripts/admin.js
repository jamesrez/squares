var socket = io();
$(document).ready(function(){
  $('#adminRoomWipeBtn').click(function(e){
    e.preventDefault();
    roomName = $('#adminRoomWipe').val();
    socket.emit('deleteRoomSquares', {roomName : roomName});
    $('#clearMsg').text("Room: " + roomName + " has been cleared!");
  })
})
