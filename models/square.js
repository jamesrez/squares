var mongoose = require('mongoose');

var squareSchema = mongoose.Schema({
  pos : Object,
  width : {type : Number, default : 100},
  height : {type :Number, default : 100},
  zIndex : Number,
  text : String,
  color : String,
  owner : String,
  imageSrc : String,
  hide : {type : Boolean, default : false}
});
var Square = mongoose.model("Square" , squareSchema);

module.exports = Square;
