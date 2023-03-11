const GameRoom = require('../models/GameRoom.model');
const User = require('../models/User.model');
const Pin = require('../models/Pin.model');
const db = require("../db");
const GameManager = require('../game/GameManager');
const gameManager = new GameManager();


// amount of games to be seeded
const GAMES_AMOUNT = 7;

const users = [{
        username: 'rhaegar',
        email: 'rhaegar@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',
    }, {
        username: 'eddard',
        email: 'eddard@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',

    },{
        username: 'jaime',
        email: 'jamie@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',
    }, {
        username: 'cersei',
        email: 'cersei@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',
    },{
        username: 'tyrion',
        email: 'tyrion@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',
    }, {
        username: 'arya',
        email: 'arya@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',
    },{
        username: 'sansa',
        email: 'sansa@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',
    }, {
        username: 'cat',
        email: 'cat@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',
    },{
        username: 'jonsnow',
        email: 'jonsnow@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',
    }, {
        username: 'brienne',
        email: 'brienne@fake.mail',
        password: '123',
        image: 'http://res.cloudinary.com/dmbdo5peg/image/upload/c_limit,w_200/v1/iron-social/whsajsw8wo2mgy2ricor',
    },
]

async function seed() {
    console.log('creating users')
    const dbUsers = await User.create(users);

    console.log('creating games')
    const rooms = []
    for (let i = 0; i < GAMES_AMOUNT; i++) {
        const pin = await Pin.findOne();
        await Pin.deleteOne(pin);
        const user = dbUsers[i % dbUsers.length];

        const state = {};
        state.players = [gameManager.createPlayer(user)]
        state.status = 'Lobby';

        const createdGame =  await GameRoom.create({
            owner: user,
            name: gameManager.GAME_DATA.defaultGameName(user), 
            maxPlayers: Math.floor(Math.random() * 10 + 5), 
            isPublished: true, 
            spokenLanguage: ['English', 'French', 'English', 'German', 'English', 'Italian', 'English', 'Spanish'][Math.floor(Math.random() * 8)], 
            pin: pin.pin,
            state
        });
        rooms.push(createdGame)
    }
    
    console.log('signing people up for games')
    for (let i = 0; i < rooms.length; i++) {
        room = rooms[i];
        for (let j = 0; j < dbUsers.length; j++) {
            user = dbUsers[j];
            if (Math.random() < .7) {
                const result = gameManager.takeAction(user, 'join', room);
                if (!result.error) {
                    room.state = result;
                    await room.save()
                }
            }
        }
    }

    console.log('done seeding')
    db.connection.close();
}

seed()