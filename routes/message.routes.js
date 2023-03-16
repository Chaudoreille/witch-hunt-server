const express = require("express");
const router = express.Router();

const Message = require("../models/Message.model");

/**
api/messages?game=gameRoomId&last=timestamp	GET	display list of messages for room	
 */
// NOTE: This route is no longer actively being used due to the move to socket.io
router.get('/', async (req, res, next) => {
    try {
        const query = {
            game: req.query.game,
        }

        if(req.query.last) {
            const isValidStamp = new Date(req.query.last).getTime() > 0

            if (!isValidStamp) {
                return res.status(400).send({ message: "Invalid timestamp" })
            }
            if (req.query.last && isValidStamp) {
                query.updatedAt = { $gt: req.query.last };
            }
        }
        
        const messages = await Message.find(query).populate('author', {username: 1, image: 1})

        res.json(messages)
    } catch (error) {
        next(error)
    }
})

/** api/messages	POST		send a message */
// NOTE: This route is no longer actively being used due to the move to socket.io
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
