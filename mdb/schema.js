const express = require('express')
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

mongoose.connect('mongodb+srv://mongodb:mongodb@cluster0.phyzp74.mongodb.net/?retryWrites=true&w=majority')
.then(()=> console.log(`connected to db`))
.catch((err)=> console.log(`error at connecting mongoDB`, err))

////////////////////////////////////////////////////////////

const accountSchema = new mongoose.Schema({
    name: {type: String, require: true},
    username: {type: String, require: true},
    email: {type: String, require: true},
    password: {type: String, require: true},
    friend: [],
    friendreqsent:[],
    friendreq: [],
    online: {type: String},
    profilepic:{
        name: String,
        img:{
            data: Buffer,
            contentType: String
        }
    }
})

const Account = mongoose.model('Account', accountSchema);

////////////////////////////////////////////////////////////////

module.exports = Account;
