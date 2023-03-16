const express = require("express");
const { isValidObjectId } = require("mongoose");
const router = express.Router();

const { isAuthenticated } = require("../middleware/auth.middleware");
const { isGameRoomOwner } = require('../middleware/game.middleware');

const GameRoom = require("../models/GameRoom.model");
const Pin = require('../models/Pin.model');
const Message = require('../models/Message.model');

const gameManager = new (require('../game/GameManager'));
const GAME_DATA = gameManager.GAME_DATA;

/**
 * All routes in this file are prefixed by /api/game-room
 */


/**
 * Creating a game room. The creator of the game room is set as it's owner and
 * also automatically added to the player list of the game state
 */
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { name, maxPlayers, isPublished, spokenLanguage } = req.body;

    // the provided maxPlayers value should already be guarded by protection on the frontend,
    // but we still need to validate that the value matches restrictions provided by the game data
    if (maxPlayers > GAME_DATA.maxPlayers || maxPlayers < GAME_DATA.minPlayers) return res.status(400).json({ fields: '', message: `You need between ${GAME_DATA.minPlayers} and ${GAME_DATA.maxPlayers} players!` });

    // set up the initial game state - most parts are handled by default values,
    // but we need to make sure to sign up the owner to the game
    const state = {};
    state.players = [gameManager.createPlayer(req.user)];

    // fetch a fresh pin from our database (which is pre-seeded with a high number of unique pins)
    const pin = await Pin.findOne();
    await Pin.deleteOne(pin);

    const createdGame = await GameRoom.create({
      owner: req.user,
      name: name || GAME_DATA.defaultGameName(req.user),
      maxPlayers: maxPlayers || GAME_DATA.defaultMaxPlayers,
      isPublished: isPublished !== undefined ? isPublished : GAME_DATA.defaultIsPublished,
      spokenLanguage: spokenLanguage || GAME_DATA.defaultLanguage,
      pin: pin.pin,
      state
    });

    if (createdGame) return res.status(201).json(createdGame);

    // we there was no createdGame, something went wrong and we throw an error, informing ErrorHandling mechanism
    throw new Error('Gameroom creation failed');

  } catch (error) {
    next(error);
  }
});

/**
 * Get a list of all public game rooms that are currently in the Lobby state
 * Result can be adjusted by including a query
 */
router.get('/', async (req, res, next) => {
  try {
    const query = {};

    // If a pin was provided, we look just for that one specific room and return it
    if (req.query.pin) {
      query.pin = req.query.pin;
      const room = await GameRoom.findOne(query);
      if (room) return res.json(room);

      return res.status(404).json({ message: 'Room not found' });
    }

    // if a language and/or name was provided as part of the query, set up filters
    if (req.query.spokenLanguage) {
      query.spokenLanguage = {
        $regex: `.*${req.query.spokenLanguage}.*`,
        $options: 'i'
      };
    }
    if (req.query.name) {
      query.name = {
        $regex: `.*${req.query.name}.*`,
        $options: 'i'
      };
    }

    // If we are not looking for games by a specific person, only return public games
    if (!req.query.owner) {
      query.isPublished = true;
      query['state.status'] = 'Lobby';
    } else {
      query["state.players.user"] = req.query.owner;
    }

    const rooms = await GameRoom.find(query).sort({ updatedAt: -1 });

    // No error checking needed for whether any rooms exist at all or result is empty
    // if the array is empty, front end simply displays no rooms when looping over array
    return res.json(rooms);
  } catch (error) {
    next(error);
  }
});

/**
 * Modifying a game room - changing the rooms settings
 * Access to this route requires not just authentication
 * but also authorization - only the owner of the room can
 * edit it
 */
router.patch('/:roomId', isAuthenticated, isGameRoomOwner, async (req, res, next) => {
  const room = req.gameRoom;
  try {
    const { isPublished, spokenLanguage, maxPlayers, name } = req.body;

    // Checking for invalid input values. At the current time, the only field that can
    // actually have an invalid value is the maxPlayers one
    const invalidFields = [];
    if (maxPlayers > GAME_DATA.maxPlayers) invalidFields.push('maxPlayers');

    if (invalidFields.length)
      return res.status(400).json({ invalidFields, message: 'One or more specified fields had invalid values!' });

    if (isPublished !== undefined) room.isPublished = isPublished;
    if (spokenLanguage) room.spokenLanguage = spokenLanguage;
    if (maxPlayers) room.maxPlayers = maxPlayers;
    if (name) room.name = name;

    const updatedRoom = await room.save();

    res.status(202).json(updatedRoom);
  } catch (error) {
    next(error);
  }
});

/**
 * Deleting a room
 * Access to this route requires not just authentication
 * but also authorization - only the owner of the room can
 * delete it
 */
router.delete('/:roomId', isAuthenticated, isGameRoomOwner, async (req, res, next) => {
  const room = req.gameRoom;
  try {
    // When deleting a game room, we also need to delete all messages refering to that room
    await Message.deleteMany({ game: room });
    await room.deleteOne();

    return res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
