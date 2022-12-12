const express = require('express')
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

mongoose.connect('mongodb+srv://mongodb:mongodb@cluster0.phyzp74.mongodb.net/?retryWrites=true&w=majority')
.then(()=> console.log(`connected to db`))
.catch((err)=> console.log(`error at connecting mongoDB`, err))

////////////////////////////////////////////////////////////////

const imageSchema = new mongoose.Schema({
    username:{type:String, require:true},
    name:{type: String, require:true},
    img:{
        data: Buffer,
        contentType: String
    }
})

const Image = mongoose.model('Image', imageSchema);

/////////////////////////////////////////////////////////////////

module.exports=Image