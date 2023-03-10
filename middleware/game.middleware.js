const User = require("../models/User.model");
const GameRoom = require('../models/GameRoom.model');
const { isValidObjectId } = require("mongoose");

async function isGameRoomOwner (req, res, next) {
    const roomId = req.params.roomId;
    if (!isValidObjectId(roomId)) return res.status(400).json({message: 'Invalid Room Id'});
    try {
        const room = await GameRoom.findOne({_id: roomId, owner: req.user});
        if (!room) return res.status(403).json({message: 'No room belonging to this user found under the specified id!'})
        req.gameRoom = room;
        next()
    } catch (error) {
        next(error);
    }
}

module.exports = {isGameRoomOwner}