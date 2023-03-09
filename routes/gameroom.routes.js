const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth.middleware");

const GameRoom = require("../models/GameRoom.model");



/**
 * api/message/create-room for testing purpose
 */

router.post("/messages/createRoom", async (req, res, next) => {
    try {
        const { name, maxPlayers, isPublished, spokenLanguage } = req.body;
        const createdGame = await GameRoom.create({ owner: req.user._id, maxPlayers, isPublished, spokenLanguage, name });

        res.sendStatus(201)
    } catch (error) {
        next(error);
    }
});




module.exports = router;
