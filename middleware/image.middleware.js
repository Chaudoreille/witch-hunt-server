const express = require("express");
const router = express.Router();
const { fileUploader, cloudinary } = require("../config/cloudinary.config");

router.use(fileUploader.single("image"));

/**
 * Middleware used for routes where user can upload a picture.
 * Will upload the picture automatically to cloudinary platform.
 */
router.use((req, res, next) => {
  try {
    if (req.file) {
      let transformed = cloudinary.url(req.file.filename, {
        width: 200,
        height: 200,
        crop: "fill",
      });
      if (transformed.startsWith("http:")) {
        transformed = "https" + transformed.slice(4);
      }
      req.body.image = transformed;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = router;