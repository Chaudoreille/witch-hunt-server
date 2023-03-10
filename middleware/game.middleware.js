const User = require("../models/User.model");
const GameRoom = require('../models/GameRoom.model')

function isGameRoomOwner (req, res, next) {
    const roomId = req.params.roomId;
    if (!isValidObjectId(roomId)) return res.status(400).json({message: 'Invalid Room Id'});

}

module.exports = {isGameRoomOwner}