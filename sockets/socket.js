const { Server } = require("socket.io");
const ORIGIN = process.env.ORIGIN || "http://localhost";
const Message = require("../models/Message.model");

const gameManager = new (require('../game/GameManager'));


const { socketIsAuthenticated } = require('../middleware/auth.middleware');
const GameRoom = require("../models/GameRoom.model");
const User = require("../models/User.model");

function createIO(server) {
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

        io.to(game).emit("message", createdMessage);
      } catch (error) {
        console.log(error);
      }
    });

    socket.on('end', function () {
      console.log("socket disconnected:", socket.id);
      socket.disconnect(0);
    });

    socket.on('game-action', async (action, parameters, callback) => {
      try {
        const room = await GameRoom.findById(socket.game).populate('state.players.user', { username: 1, image: 1 });;
        console.log('USER', socket.user)
        if (!room) throw Error('Room not found!');

        const result = gameManager.takeAction(socket.user, action, room, parameters);

        if (result.error) throw Error(result.error);

        room.state = result;

        // moved populate
        // await room.populate('state.players.user', { username: 1, image: 1 });
        await room.save();
        io.to(socket.game).emit('update-room', room);

        callback(null);
      } catch (error) {
        console.log(error)
        callback(error.message);
      }
    });

    socket.on('force-update', async function () {
      try {
        const room = await GameRoom.findById(socket.game)
          .populate('state.players.user', { username: 1, image: 1 });

        io.to(socket.game).emit('update-room', room);
      } catch (error) {
        socket.emit('error', error.message);
      }
    });

    socket.on('delete-room', function (callback) {
      io.to(socket.game).emit("deleted-room", "The game owner has deleted this room.");
      callback();
    });

    GameRoom.findById(socket.game).populate('state.players.user', { username: 1, image: 1 })
      .then((room) => socket.emit('update-room', room))
      .catch(error => socket.emit('error', error.message));

    Message.find({ game: socket.game }).populate('author', { username: 1, image: 1 })
      .then(messages => { socket.emit('initialize-messages', messages); })
      .catch(error => socket.emit('error', error.message));
  });

  return io;
}

module.exports = createIO;



/**
 * BACKEND
 * force-update -> update game room
 * game-action -> update game room
 * 
 * FRONTEND
 * update-room
 * error
 * 
 */