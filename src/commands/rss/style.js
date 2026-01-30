const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const rssController = require("../../controller/rssController");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rss-style")
    .setDescription("Customize the appearance of RSS feed messages")
    .addStringOption((option) =>
      option
        .setName("feed-id")
        .setDescription("The ID of the feed to customize (use /rss-list to see IDs)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Embed color in hex format (e.g., #ff0000)")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("max-description")
        .setDescription("Maximum description length (50-1000 characters)")
        .setMinValue(50)
        .setMaxValue(1000)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("show-image")
        .setDescription("Show images in embeds")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("show-timestamp")
        .setDescription("Show publication timestamp")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Custom name for this feed")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const feedId = interaction.options.getString("feed-id");
      const color = interaction.options.getString("color");
      const maxDescription = interaction.options.getInteger("max-description");
      const showImage = interaction.options.getBoolean("show-image");
      const showTimestamp = interaction.options.getBoolean("show-timestamp");
      const name = interaction.options.getString("name");

      const styleUpdates = {};
      if (color) styleUpdates.color = color;
      if (maxDescription !== null) styleUpdates.maxDescriptionLength = maxDescription;
      if (showImage !== null) styleUpdates.showImage = showImage;
      if (showTimestamp !== null) styleUpdates.showTimestamp = showTimestamp;

      let response = "";

      if (Object.keys(styleUpdates).length > 0) {
        const styleResult = await rssController.updateCardStyle(feedId, styleUpdates);
        response += `✅ ${styleResult.message}\n`;
      }

      if (name) {
        const nameResult = await rssController.updateFeedName(feedId, name);
        response += `✅ ${nameResult.message}\n`;
      }

      if (response === "") {
        response = "ℹ️ No changes made. Provide at least one option to update.";
      }

      await interaction.editReply({ content: response });
    } catch (error) {
      console.error("Error in rss-style command:", error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
      });
    }
  },
};
