require("dotenv").config();
const GameRoom = require('../models/GameRoom.model');
const Pin = require('../models/Pin.model')
const db = require("../db");

CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
PINSIZE = 6;
AMOUNT = 100000;

// NOTE: For a live game, the seeding should be adjusted so it is possible to run periodically
// As right now, it does not take into account the already existing pins in existing
// gameroom and pin db collections

async function generatePins() {
    console.log('start')
    let tries = 0;
    const pinSet = new Set();

    while (pinSet.size < AMOUNT) {
        let newPin = '';
        for (let i = 0; i < PINSIZE; i++) {
            newPin += CHARSET[Math.floor(Math.random() * CHARSET.length)]
        }
        pinSet.add(newPin)
        tries++;
    }

    const pinArray =  Array.from(pinSet).map(pin=>{return {pin:pin}})

    await Pin.insertMany(pinArray);

    console.log(`pin generation done, needed ${tries} tries to generate ${AMOUNT} unique pins`)
    db.connection.close();
}


generatePins();
