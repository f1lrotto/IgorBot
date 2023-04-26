const mongoose = require("mongoose");

const zsskSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    tweet: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    wasSent: {
      type: Boolean,
      required: true,
    }
  },
  {
    versionKey: false,
  }
)

module.exports = mongoose.model("ZSSK", zsskSchema);