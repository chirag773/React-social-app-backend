    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    var UserSchema = new Schema({
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required:true
        },
        avatar:{
            type:String,
        },
        following: [
            {
                user:{ 
                    type: Schema.ObjectId, 
                    ref: 'User' 
                },
            }
            
        ],
        followers: [
            {
                user:{ 
                    type: Schema.ObjectId, 
                    ref: 'User' 
                },
            }
        ],
        date:{
            type:Date,
            default: Date.now
        },
    });

    module.exports = mongoose.model("User", UserSchema);