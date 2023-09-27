const mongoose = require("mongoose");

const articlesSchema = new mongoose.Schema(
  {
    articleId: {
      type: String,
      required: true,
    },
    articleDate: {
      type: String,
      required: true,
    },
    articleTime: {
      type: String,
      required: true,
    },
    category: {
      type: String,
    },
    headline: {
      type: String,
      required: true,
    },
    articleContent: {
      type: String,
      required: true,
    },
    articleUrl: {
      type: String,
      required: true,
    },
    theme: {
      type: Array,
    },
    img: {
      type: String,
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

module.exports = mongoose.model("Post", articlesSchema);
