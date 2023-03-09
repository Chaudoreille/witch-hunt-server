const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth.middleware");

// all routes beyond this point need authentication
router.use(isAuthenticated);

/**
 * Absolute path: /api/
 */
router.get("/", (req, res, next) => {
  res.sendStatus(200);
});

router.use("/", require("./gameroom.routes"))
router.use("/", require("./message.routes.js"))


module.exports = router;
