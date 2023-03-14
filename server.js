const app = require("./app");
const Message = require("./models/Message.model");
const { socketIsAuthenticated } = require('./middleware/auth.middleware');


// ℹ️ Sets the PORT for our app to have access to it. If no env has been set, we hard code it to 5005
const PORT = process.env.PORT || 5005;
const ORIGIN = process.env.ORIGIN || "http://localhost";

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

const { Server } = require("socket.io");
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
});

