const express = require("express");
const router = express.Router();

const GameRoom = require("../models/GameRoom.model");



/**
 * api/game-room WIP
 */

router.post("/", async (req, res, next) => {
    try {
        const { name, maxPlayers, isPublished, spokenLanguage } = req.body;
        const createdGame = await GameRoom.create({ owner: req.user._id, name, maxPlayers, isPublished, spokenLanguage });

        res.sendStatus(201)
    } catch (error) {
        next(error);
    }
});




module.exports = router;
