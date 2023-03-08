const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");

const User = require("../models/User.model");

/**
 * Absolute path: /auth/signup
 * Create new User
 */
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, username, image } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide username, email and password" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email address already in use." });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = await User.create({ email, password: hashedPassword, username, image });

    // remove password from newUser before we add it to the response.
    const userData = (({ _id, username, email, image }) => ({ _id, username, email, image }))(createdUser);

    res.status(201).json({ user: userData });
  } catch (error) {
    next(err);
  }
});

module.exports = router;
