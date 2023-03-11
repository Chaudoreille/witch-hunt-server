const GameRoom = require('../models/GameRoom.model');
const User = require('../models/User.model');
const bcrypt = require("bcrypt");
const Pin = require('../models/Pin.model');
const db = require("../db");
const GameManager = require('../game/GameManager');
const gameManager = new GameManager();


// amount of games to be seeded
const GAMES_AMOUNT = 12;

const users = [{
        username: 'Alexandre',
        email: 'alex@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/22.jpg',
    }, {
        username: 'Bertie',
        email: 'bert@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/72.jpg',
    },{
        username: 'Charles',
        email: 'chuck@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/40.jpg',
    }, {
        username: 'Denis',
        email: 'denis@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/76.jpg',
    },{
        username: 'Emilia',
        email: 'emilia@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/women/29.jpg',
    }, {
        username: 'Francoise',
        email: 'franzi@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
    },{
        username: 'Gustave',
        email: 'gustave@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/53.jpg',
    }, {
        username: 'Helene',
        email: 'helene@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/women/30.jpg',
    },{
        username: 'Irma',
        email: 'irma@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/women/28.jpg',
    }, {
        username: 'Juliette',
        email: 'jules@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/women/78.jpg',
    },{
        username: 'Karla',
        email: 'karla@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/women/91.jpg',
    }, {
        username: 'Lucienne',
        email: 'luzifer@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/women/90.jpg',

    },{
        username: 'Matthieu',
        email: 'matt@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/31.jpg',
    }, {
        username: 'Nicolas',
        email: 'nic@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/60.jpg',
    },{
        username: 'Olivier',
        email: 'oli@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/10.jpg',
    }, {
        username: 'Pauline',
        email: 'pauline@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/women/84.jpg',
    },{
        username: 'Quentin',
        email: 'quentin@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/27.jpg',
    }, {
        username: 'Ricardo',
        email: 'ric@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/41.jpg',
    },{
        username: 'Stephane',
        email: 'steve@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/21.jpg',
    }, {
        username: 'Thomas',
        email: 'tom@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
    }, {
        username: 'Sebastian',
        email: 'seb@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/lego/0.jpg',
    },{
        username: 'Arthur',
        email: 'chaud@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/lego/5.jpg',
    },{
        username: 'Delfina',
        email: 'delfina@fake.mail',
        password: '123',
        image: 'https://randomuser.me/api/portraits/lego/1.jpg',
    },
]

async function seed() {
    console.log('deleting any existing Users and GameRooms')

    await User.deleteMany();
    await GameRoom.deleteMany();

    console.log('creating users')

    const dbUsers = [];
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(user.password, salt);
        user.password = hashedPassword;
        
        const newUser = await User.create(user);
        dbUsers.push(newUser);
    }

    console.log('creating games')
    const rooms = []
    for (let i = 0; i < GAMES_AMOUNT; i++) {
        const pin = await Pin.findOne();
        await Pin.deleteOne(pin);
        let user = dbUsers[i % dbUsers.length];

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
            if (Math.random() < .3) {
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