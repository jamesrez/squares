var mongoose = require('mongoose');

var roomSchema = mongoose.Schema({
  name : String,
  owner : String,
  squares : [mongoose.Schema.Types.ObjectId]
});
var Room = mongoose.model("Room" , roomSchema);

module.exports = Room;
