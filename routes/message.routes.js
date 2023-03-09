const express = require("express");
const router = express.Router();

const Message = require("../models/Message.model");






/**
api/messages?game=gameRoomId&last=timestamp	GET	display list of messages for room	
 */

router.get('/', async (req, res, next) => {

    const query = {
        game: req.query.game,
    }

    try {
        const messages = await Message.find(query)
        res.json(messages)
    } catch (error) {
        next(error)
    }
})

/** api/messages	POST		send a message */

router.post('/', async (req, res, next) => {
    try {
        const { content, gameId } = req.body
        const createdMessage = await Message.create({ author: req.user._id, game: gameId, content })
        res.status(201).json(createdMessage)
    } catch (error) {
        next(error)
    }
})



module.exports = router;
