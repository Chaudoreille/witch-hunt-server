const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth.middleware");

router.use("/game-rooms", require("./gameroom.routes"));

// all routes beyond this point need authentication
router.use(isAuthenticated);

/**
 * Absolute path: /api/
 */
router.get("/", (req, res, next) => {
  res.sendStatus(200);
});

router.use("/profile", require("./profile.routes"));

module.exports = router;
