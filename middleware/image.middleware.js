const express = require("express");
const router = express.Router();
const { fileUploader, cloudinary } = require("../config/cloudinary.config");

router.use(fileUploader.single("image"));

router.use((req, res, next) => {
  try {
    if (req.file) {
      let transformed = cloudinary.url(req.file.filename, {
        width: 200,
        crop: "limit",
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