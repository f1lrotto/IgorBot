const mongoose = require("mongoose");

const rssItemSchema = new mongoose.Schema(
  {
    feedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RssFeed",
      required: true,
      index: true,
    },
    guid: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    pubDate: {
      type: Date,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    categories: {
      type: [String],
      default: [],
    },
    wasSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rssItemSchema.index({ feedId: 1, guid: 1 }, { unique: true });

module.exports = mongoose.model("RssItem", rssItemSchema);
