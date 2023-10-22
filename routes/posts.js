const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    data:String,
    likes: [
        {type: mongoose.Schema.Types.ObjectId, ref: "user"}
    ],
    postimage:{
        type:String
    },
    time:{
        type:Date,
        default:Date.now()
    },
})
module.exports = mongoose.model("post",postSchema)