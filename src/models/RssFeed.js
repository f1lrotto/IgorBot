const mongoose = require("mongoose");

const rssFeedSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      index: true,
    },
    feedUrl: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    feedName: {
      type: String,
      required: true,
    },
    feedIcon: {
      type: String,
      default: null,
    },
    lastChecked: {
      type: Date,
      default: null,
    },
    lastItemGuid: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    cardStyle: {
      color: {
        type: String,
        default: "#d45959",
      },
      showImage: {
        type: Boolean,
        default: true,
      },
      maxDescriptionLength: {
        type: Number,
        default: 300,
      },
      showTimestamp: {
        type: Boolean,
        default: true,
      },
    },
    isBuiltIn: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

rssFeedSchema.index({ guildId: 1, feedUrl: 1 }, { unique: true });

module.exports = mongoose.model("RssFeed", rssFeedSchema);
