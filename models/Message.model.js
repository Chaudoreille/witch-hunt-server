const { Schema, model } = require("mongoose");
const User = require("./User.model");
const GameRoom = require("./GameRoom.model");

const messageSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: [true, "Message needs a User reference"],
    },
    game: {
      type: Schema.Types.ObjectId,
      ref: GameRoom,
      required: [true, "Message needs a GameRoom reference"],
    },
    content: {
      type: String,
      required: [true, "Message content required"]
    }
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const Message = model("Message", messageSchema);

module.exports = Message;
