const { Server } = require("socket.io");
const ORIGIN = process.env.ORIGIN || "http://localhost";
const Message = require("../models/Message.model");

const gameManager = new (require('../game/GameManager'));


const { socketIsAuthenticated } = require('../middleware/auth.middleware');
const GameRoom = require("../models/GameRoom.model");

function createIO(server){
    const io = new Server(server, {
    cors: {
        origin: ORIGIN,
        methods: ["GET", "POST"]
    }
    });

    io.use(socketIsAuthenticated);

    io.on("connection", (socket) => {
        console.log("socket connected:", socket.id);
        socket.join(socket.game);

        socket.on("message", async (message) => {
            const { content } = message;
            const { user, game } = socket;
            try {
            const createdMessage = await Message.create({ content, game: game, author: user.id });
            await createdMessage.populate("author", { username: 1, image: 1 });
            console.log(createdMessage);

            io.to(game).emit("message", createdMessage);
            } catch (error) {
            console.log(error);
            }
        });

        socket.on('end', function () {
            console.log("socket disconnected:", socket.id);
            socket.disconnect(0);
        });

        socket.on('game-action', async (action, parameters) => {
            try {
                const room = await GameRoom.findById(socket.game);
                if (!room) throw Error('Room not found!');

                const result = gameManager.takeAction(req.user, action, room, parameters);

                if (result.error) throw Error(result.error);

                room.state = result;
                await room.save();

                io.to(socket.game).emit('update-room', room)
                if (action==='leave') socket.emit('leave')
            } catch (error) {
                socket.emit('error', error.message);
            }
        })

        socket.on('update', async function () {
            try {
                const room = await GameRoom.findById(socket.game).populate('state.players.user', { username: 1, image: 1 });
                socket.to(socket.game).emit('update-room', room)
            } catch (error) {
                socket.emit('error', error.message);
            }
        })

        GameRoom.findById(socket.game).populate('state.players.user', { username: 1, image: 1 })
            .then((room)=>socket.emit('update-room', room))
            .catch(error=>socket.emit('error', error.message));
    });
    
    return io;
}

module.exports = createIO;



/**
 * BACKEND
 * update -> update game room
 * game-action -> update game room
 * 
 * FRONTEND
 * update-room
 * error
 * 
 */