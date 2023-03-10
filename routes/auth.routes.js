const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jsonWebToken = require("jsonwebtoken");
const { isAuthenticated } = require("../middleware/auth.middleware");
const { requiredFields } = require("../middleware/validators.middleware");
const imageHandler = require("../middleware/image.middleware");
const { isValidEmail } = require("../utils/utils");

const User = require("../models/User.model");

/**
 * Absolute path: /auth/signup
 * Create new User
 */
router.post(
  "/signup",
  imageHandler,
  requiredFields("username", "email", "password"),
  async (req, res, next) => {
    try {
      const { email, password, username, image } = req.body;

      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email address already in use." });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const createdUser = await User.create({
        email,
        password: hashedPassword,
        username,
        image,
      });

      if (!createdUser) {
        throw new Error("User creation failed");
      }
      res.sendStatus(201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Absolute path: /auth/login
 * Create and send Authentication Token
 */
router.post(
  "/login",
  requiredFields("email", "password"),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({ message: "User not found." });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // extract id for payload
      const payload = { _id: user._id };

      const authToken = jsonWebToken.sign(payload, process.env.TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "2 days",
      });

      res.status(201).json({ authToken });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Absolute path: /auth/me
 * Sends user back in data.
 */
router.get("/me", isAuthenticated, (req, res, next) => {
  try {
    res.status(200).send(req.user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
