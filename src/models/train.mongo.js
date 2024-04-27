const mongoose = require("mongoose");

const trainSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    content: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    wasSent: {
      type: Boolean,
      required: true,
      default: false,
    }
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Train", trainSchema);
