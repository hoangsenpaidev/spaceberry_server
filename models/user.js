const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    password: { type: String, },
    username: { type: String },
    domain: { type: String },
    image: { type: String },
    birthday: { type: String },
    joindate: { type: String },
    active: {
        type: Boolean,
        default: false,
    },
    national: { type: String },
    otpcode: { type: String }
}, {
    timestamps: true,
})

let UserModel = mongoose.model('User', userSchema)

module.exports = { UserModel }