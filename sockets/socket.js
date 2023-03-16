const { Server } = require("socket.io");
const ORIGIN = process.env.ORIGIN || "http://localhost";
const Message = require("../models/Message.model");

const gameManager = new (require('../game/GameManager'));

const { socketIsAuthenticated } = require('../middleware/auth.middleware');
const GameRoom = require("../models/GameRoom.model");

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


    /**
     * This event is used when a player sends a message to the chat.
     * The event handler will validate that it is possible for the player to
     * send a message to the chat first, and if so, create the message in
     * the database and send it to all members of the game room
     */
    socket.on("message", async (message) => {
      const { content } = message;
      const { user, game } = socket;
      try {
        // Messages cannot be sent:
        // - during night time
        // - by players that are not participating in the match
        // - by players that have been killed
        const room = await GameRoom.findById(game);
        if (room.state.mode === 'Nighttime') return socket.emit('error', 'You cannot send messages during the night. Go to sleep!');

        const currentPlayer = room.state.players.filter(player => player.user.equals(socket.user._id))[0];
        if (!currentPlayer) return socket.emit('error', 'Only participating players can talk in the chat!');
        if (currentPlayer.status !== 'Alive') return socket.emit('error', 'The dead remain silent!');

        const createdMessage = await Message.create({ content, game: game, author: user.id });
        await createdMessage.populate("author", { username: 1, image: 1 });

        io.to(game).emit("message", createdMessage);
      } catch (error) {
        console.log(error);
      }
    });

    /**
     * This event is used to disconnect a user when he leaves the game room page
     */
    socket.on('end', function () {
      console.log("socket disconnected:", socket.id);
      socket.disconnect(true);
    });

    /**
     * This event is triggered whenever a game action is performed. This includes any action that modifies the game state.
     * 
     * The event handler itself is action-agnostic - it does not care which action is being performed, it simply hands the information
     * to the game manager, which will then validate the action to make sure it is a legit action that can be performed, and if so, modify
     * the game state to the result of the action
     */
    socket.on('game-action', async (action, parameters, callback) => {
      try {
        const room = await GameRoom.findById(socket.game).populate('state.players.user', { username: 1, image: 1 });;
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

    /**
     * This event is triggered after the game owner edits the room settings.
     * It is used so all players can receive the updated room information
     */
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


    // As the socket connection is set up right when someone opens a game room, they need
    // the current information about the room, as well as all messages that have been sent so far
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