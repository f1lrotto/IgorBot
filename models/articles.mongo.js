const mongoose = require("mongoose");

const articlesSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    text: {
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
);

module.exports = mongoose.model("Post", articlesSchema);
