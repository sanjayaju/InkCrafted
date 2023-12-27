const mongoose = require("mongoose");
const crypto = require('crypto')


// mongoose.set('strictQuery',false);
const connectdb = async()=>{
    try {
        const con = await mongoose.connect(process.env.mongodb_uri)
        .then(()=>{
            console.log("its connected");
        })
    } catch (error) {
        console.log("err from db")
    }
     
}
const secretKey = crypto.randomBytes(32).toString('hex')
module.exports ={
connectdb,
secretKey
}