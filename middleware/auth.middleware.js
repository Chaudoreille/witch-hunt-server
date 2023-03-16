const jsonWebToken = require("jsonwebtoken");
const GameRoom = require("../models/GameRoom.model");
const User = require("../models/User.model");

class AuthenticationError extends Error { };

/**
 * Authentication Middleware.
 * Verifies that a valid authentication token is provided and saves the corresponding user
 * to the request.
 * Blocks connections to the server by non-authenticated clients.
 * @param {Request} req
 * @param {Response} res 
 * @param {NextFunction} next 
 * @returns 
 */
const isAuthenticated = async (req, res, next) => {
  try {
    // Check for existance of Bearer auth token in the headers
    const { authorization } = req.headers;
    if (!authorization || authorization.split(" ")[0] !== "Bearer") {
      return res.status(401).json({ message: "Authentication token required" });
    }

    // If a token was found, verify that it can be decrypted to a valid user ID, using our
    // secret key
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
      return res.status(401).json({ message: "Invalid authentication token" });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authentication Middleware.
 * Verifies that a valid authentication token is provided and saves the corresponding user
 * to the request.
 * Blocks connections to the socket server by non-authenticated clients.
 * @param {IOSocket} socket 
 * @param {NextFunction} next 
 */
const socketIsAuthenticated = async (socket, next) => {
  try {
    const { auth, query } = socket.handshake;
    const payload = jsonWebToken.verify(auth.token, process.env.TOKEN_SECRET);
    const user = await User.findById(payload._id, {username: 1, image: 1});

    if (!user) throw new AuthenticationError("User not found");

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