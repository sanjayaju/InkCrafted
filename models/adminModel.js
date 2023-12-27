const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

adminSchema.pre('save', async function (next) {
    // Hash the password before saving
    const admin = this;

    try {
        console.log('Before save:', admin);
        if (!admin.isModified('password')) {
            console.log('Password not modified, skipping hashing.');
            return next();
        }

        const saltRounds = 10;
        console.log('Password before hashing:', admin.password);
        const hashedPassword = await bcrypt.hash(admin.password, saltRounds);
        console.log('Password after hashing:', hashedPassword);
        admin.password = hashedPassword;

        console.log('After save:', admin);
        return next();
    } catch (error) {
        console.error('Error during save:', error);
        return next(error);
    }
});

module.exports = mongoose.model('Admin', adminSchema);
