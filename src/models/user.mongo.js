const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  totalMessages: { type: Number, default: 0 },
  messagesPerChannel: [
    {
      channelId: String,
      count: { type: Number, default: 0 },
    },
  ],
  totalVoiceTime: { type: Number, default: 0 }, // total voice time in milliseconds
});

module.exports = mongoose.model("UserActivity", userActivitySchema);
