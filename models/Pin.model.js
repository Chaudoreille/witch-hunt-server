const { Schema, model } = require("mongoose");

const pinSchema = new Schema({
    pin: {
        type: String,
        maxLength: 6,
        unique: true,
    }
})

/**
 * Pin Model
 * This model will be used to set up a large amount of unique pins to be used
 * for game room creation, to ensure that we do not run into uniqueness issues
 */
const Pin = model('Pin', pinSchema);

module.exports = Pin;