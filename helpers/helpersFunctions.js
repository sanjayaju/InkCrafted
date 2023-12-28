const User = require('../models/userModel')

function getMonthName(monthNumber) {

    if(typeof monthNumber === 'string'){
        monthNumber = parseInt(monthNumber)
    }

    if (monthNumber < 1 || monthNumber > 12) {
        return "Invalid month number";
    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    return monthNames[monthNumber - 1];
}

const updateWallet = async (userId, amount, message) => {
    const walletHistory = {
        date: new Date(),
        amount,
        message
    }

    try {
        await User.findByIdAndUpdate(
            { _id: userId },
            {
                $inc: {
                    wallet: amount
                },
                $push: {
                    walletHistory
                }
            }
        );
        console.log('Wallet updated successfully');
    } catch (error) {
        console.error('Error updating wallet:', error.message);
        // Handle the error as needed
    }
}


module.exports = { 
    getMonthName,
    updateWallet
}