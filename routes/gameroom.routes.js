const express = require("express");
const { isValidObjectId } = require("mongoose");
const router = express.Router();

const { isAuthenticated } = require("../middleware/auth.middleware");
const {isGameRoomOwner} = require('../middleware/game.middleware')

const GameRoom = require("../models/GameRoom.model");
const Pin = require('../models/Pin.model');

/**
 * api/game-room WIP
 */

// TODO helper functions - to be extracted to utils, gameUtils, Game class or similar later on

const GAME_DATA = {
    minPlayers: 3,
    maxPlayers: 25,
    defaultGameName: (user) => `${user.username}'s Witchhunt`,
    defaultIsPublished: true,
    defaultLanguage: 'English',
    defaultMaxPlayers: 10
}

function createPlayer(player){
    return {user: player._id, status: 'Alive', vote: null}
}

/**
 * Creating a game room. The creator of the game room is set as it's owner and
 * also automatically added to the player list of the game state
 */
router.post("/", isAuthenticated, async (req, res, next) => {
    try {
        const { name, maxPlayers, isPublished, spokenLanguage } = req.body;

        const invalidFields = [];
        if (maxPlayers > GAME_DATA.maxPlayers) invalidFields.push('maxPlayers');

        if (invalidFields.length) return res.status(400).json({invalidFields, message: 'One or more specified fields had invalid values!'})

        const state = {};
        state.users = [createPlayer(req.user)]
        state.status = 'Lobby';

        const pin = await Pin.findOne();
        await Pin.deleteOne(pin);

        const createdGame =  await GameRoom.create({
            owner: req.user,
            name: name || GAME_DATA.defaultGameName(req.user), 
            maxPlayers: maxPlayers || GAME_DATA.defaultMaxPlayers, 
            isPublished: isPublished || GAME_DATA.defaultIsPublished, 
            spokenLanguage: spokenLanguage || GAME_DATA.defaultLanguage, 
            pin: pin.pin,
            state });

        if (createdGame) return res.status(201).json(createdGame);

        throw new Error('Gameroom creation failed');
        
    } catch (error) {
        next(error);
    }
});

/**
 * Get a list of all public game rooms that are currently in the Lobby state
 */
router.get('/', async (req, res, next)=>{
    try {
        const query = {};

        // If a pin was provided, we look just for that one specific room,
        // ignoring isPublished/state
        if (req.query.pin){
            query.pin = req.query.pin;
            const room = await GameRoom.findOne(query);
            if (room) return res.json(room)

            return res.status(404).json({message: 'Room not found'});
        } 

        query['state.status'] = 'Lobby';
        query.isPublished = true;

        const rooms = await GameRoom.find(query);

        // No error checking needed for whether any rooms exist at all or result is empty
        // if the array is empty, front end simply displays no rooms when looping over array
        return res.json(rooms);
    } catch (error) {
        next(error);
    }
});

/**
 * Get the information for one specific game room
 */
router.get('/:roomId', async (req, res, next)=>{
    const roomId = req.params.roomId;
    if (!isValidObjectId(roomId)) return res.status(400).json({message: 'Invalid Room Id'});

    try {
        const room = await GameRoom.findById(roomId);
        if (room) return res.json(room);
        return res.status(404).json({message: 'No room found under that id!'})
    } catch (error) {
        next(error);
    }
});

/**
 * Modifying a game room - changing the rooms settings
 */
router.patch('/:roomId', isAuthenticated, isGameRoomOwner, async (req, res, next)=>{

    try {
        
    } catch (error) {
        next(error);
    }
});


module.exports = router;
