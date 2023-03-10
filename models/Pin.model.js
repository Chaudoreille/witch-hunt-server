const { Schema, model } = require("mongoose");

const pinSchema = new Schema({
    pin: {
        type: String,
        maxLength: 6,
        unique: true,
    }
})

const Pin = model('Pin', pinSchema);

module.exports = Pin;