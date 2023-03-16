const jsonWebToken = require("jsonwebtoken");
const GameRoom = require("../models/GameRoom.model");
const User = require("../models/User.model");

class AuthenticationError extends Error { };

const isAuthenticated = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.split(" ")[0] !== "Bearer") {
      return res.status(401).json({ message: "Authorization token required" });
    }

    try {
      const payload = jsonWebToken.verify(authorization.split(" ")[1], process.env.TOKEN_SECRET);
      const user = await User.findById(payload._id);

      if (!user) {
        next(new AuthenticationError("User not found"));
      }

      const { _id, username, email, image } = user;
      req.user = { _id, username, email, image };

      next();
    } catch {
      return res.status(401).json({ message: "Invalid authorization token" });
    }
  } catch (error) {
    next(error);
  }
};

const socketIsAuthenticated = async (socket, next) => {
  try {
    const { auth, query } = socket.handshake;
    const payload = jsonWebToken.verify(auth.token, process.env.TOKEN_SECRET);
    const user = await User.findById(payload._id, {username: 1, image: 1});

    socket.user = user;

    const room = await GameRoom.findById(query.game);
    if (!room) {
      next("Invalid Room");
    }
    socket.game = query.game;
  } catch (error) {
    next(error);
  }
  next();
};

module.exports = { isAuthenticated, socketIsAuthenticated };