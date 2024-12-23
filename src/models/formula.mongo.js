const mongoose = require("mongoose");

const formulaSchema = new mongoose.Schema(
  {
    scrapeDate: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    tag: String,
    image: String,
    wasSent: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Formula", formulaSchema);
