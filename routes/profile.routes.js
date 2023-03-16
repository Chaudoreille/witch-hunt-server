const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
// const { fileUploader, cloudinary } = require("../config/cloudinary.config");
const { isValidEmail } = require("../utils/utils");
const { requiredFields } = require("../middleware/validators.middleware");
const User = require("../models/User.model");
const imageHandler = require("../middleware/image.middleware");


/**
 * Absolute path: /api/profile/
 */
router.patch("/",
  imageHandler,
  async (req, res, next) => {
    try {
      const { username, email, image, password, newPassword } = req.body;
      const update = { username, email, image };

      const user = await User.findById(req.user._id, {password: 1});

      if (newPassword || email) {
        if (!password || !bcrypt.compareSync(password, user.password)) {
          return res.status(401).json({ message: "Invalid password" });
        }

        if (newPassword) {
          const salt = bcrypt.genSaltSync(10);
          update.password = bcrypt.hashSync(newPassword, salt);
        }

        if (email && !isValidEmail(email)) {
          return res.status(400).json({ message: "Invalid email address" });
        }
      }

      const updatedUser = await User.findByIdAndUpdate(req.user._id, update, {
        new: true,
        projection: {
          password: 0,
        }
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  });

/**
 * Absolute path: /api/profile/
 */
router.delete("/", requiredFields("password"), async (req, res, next) => {
  try {
    // NOTE: cascade deletion on messages & clean user from room if problems arise.
    const user = await User.findById(req.user._id);

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const deletedUser = await User.findByIdAndDelete(req.user._id);

    if (deletedUser) {
      res.sendStatus(204);
    } else {
      throw new Error("User not found on deletion");
    }
  } catch (error) {
    next(error);
  }
});


module.exports = router;