const mongoose = require("mongoose");

const redditStoriesSchema = new mongoose.Schema(
  {
    subreddit: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    storyId: {
      type: String,
      required: true,
    },
    storyContent: {
      type: String,
      required: true,
    },
    wasSentTiktok: {
      type: Boolean,
      required: true,
      default: false,
    },
    wasSentInstagram: {
      type: Boolean,
      required: true,
      default: false,
    },
    wasSentYT: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
);

module.exports = mongoose.model("RedditStories", redditStoriesSchema);