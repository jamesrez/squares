var mongoose = require('mongoose');

var squareSchema = mongoose.Schema({
  pos : Object,
  width : Number,
  height : Number,
  zIndex : Number,
  text : String,
  color : String,
  owner : String,
  imageSrc : String
});
var Square = mongoose.model("Square" , squareSchema);

module.exports = Square;
