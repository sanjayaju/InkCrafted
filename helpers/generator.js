const bcrypt = require('bcrypt')
const User = require('../models/userModel')



const securePassword = async(password) => {
    try {
        const hashedPassword = await bcrypt.hash(password,10);
        return hashedPassword;
    } catch (error) {
        console.log(error);
    }
}





module.exports = {
    securePassword
}