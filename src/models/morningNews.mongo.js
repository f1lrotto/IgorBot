const mongoose = require("mongoose");

const morningNewsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MorningNews", morningNewsSchema);
