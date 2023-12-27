const mongoose = require('mongoose')

const productsSchema = mongoose.Schema({
    brand: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories'
    },
    InkColor:{
        type: String,
        required: false,
        enum: ['Black', 'Blue']
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number
    },
    images: {
        type: Array,
        required: true
    },
    isListed: {
        type : Boolean,
        default: true
    },
},
{
    timestamps:true,
})


module.exports = mongoose.model('Products',productsSchema)