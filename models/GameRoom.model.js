const { Schema, model } = require("mongoose");
const User = require("./User.model");

const gameRoomSchema = new Schema(
  {
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
      type: boolean,
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
      users: [{
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
            enum: { cast: "Cast", locked: "Locked" }
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
