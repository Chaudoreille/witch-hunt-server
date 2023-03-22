const { Schema, model } = require("mongoose");
const User = require("./User.model");

const gameRoomSchema = new Schema(
  {
    name: {
      type: String,
      maxLength: 40
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: [true, "Game Room owner is required"],
    },
    pin: {
      type: String,
      maxLength: 6,
    },
    maxPlayers: {
      type: Number
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    spokenLanguage: {
      type: String
    },
    state: {
      round: {
        type: Number,
        minValue: 0,
        default: 0,
      },
      status: {
        type: String,
        enum: { lobby: "Lobby", started: "Started", completed: "Completed" },
        default: 'Lobby',
      },
      players: [{
        user: {
          type: Schema.Types.ObjectId,
          ref: User,
        },
        status: {
          type: String,
          enum: { alive: "Alive", dead: "Dead" }
        },
        vote: {
          target: {
            type: Schema.Types.ObjectId,
            ref: User,
          },
          state: {
            type: String,
            enum: { cast: "Cast", locked: "Locked", null: null }
          }
        },
        role: {
          type: String,
          enum: { villager: 'Villager', witch: 'Witch', girl: "Girl", priest: "Priest" },
          default: 'Villager',
        },
        team: {
          type: String,
          enum: { villager: 'Villagers', witch: 'Witches' },
          default: 'Villagers',
        },

      }],
      mode: {
        type: String,
        enum: { day: 'Daytime', night: 'Nighttime' },
        default: 'Daytime',
      },
      winners: {
        type: String,
        enum: { villager: 'Villagers', witch: 'Witches', null: null },
        default: null,
      },
      storytime: {
        type: String,
        default: '',
      }
    },
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

/**
 * GameRoom Model.
 * This model holds all the information for the game room, both information regarding the room
 * itself (how many players are allowed, what language should be spoken, who the owner is),
 * as well as the information about the game state (is the game still in the lobby, has it been started
 * or even completed), as well as players that are participating in this match
 */
const GameRoom = model("GameRoom", gameRoomSchema);

module.exports = GameRoom;
