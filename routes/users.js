var mongoose = require('mongoose');
var passportLocalMongoose=require('passport-local-mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/passport");

var userSchema=mongoose.Schema({
  username:String,
  password:String,
  posts: [
    {type: mongoose.Schema.Types.ObjectId, ref: "post"}
  ],
  age:Number,
  email:String,
  Passon:String,
  image:{
    type:String,
    default:"def.png"
  },
  key: String,
  expirykey: Date
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('user',userSchema);