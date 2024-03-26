const bcryptjs = require('bcryptjs')
const User = require('../models/userModel')



const securePassword = async(password) => {
    try {
        const hashedPassword = await bcryptjs.hash(password,10);
        return hashedPassword;
    } catch (error) {
        console.log(error);
    }
}





module.exports = {
    securePassword
}