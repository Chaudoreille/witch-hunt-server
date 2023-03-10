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
      status: {
        type: String,
        enum: { lobby: "Lobby", started: "Started", paused: "Paused" }
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
            enum: { cast: "Cast", locked: "Locked", null:null }
          }
        }
      }]
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const GameRoom = model("GameRoom", gameRoomSchema);

module.exports = GameRoom;
