const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const rssController = require("../../controller/rssController");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rss-remove")
    .setDescription("Remove an RSS feed from this server")
    .addStringOption((option) =>
      option
        .setName("feed-id")
        .setDescription("The ID of the feed to remove (use /rss-list to see IDs)")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const feedId = interaction.options.getString("feed-id");

      const result = await rssController.removeFeed(feedId);

      await interaction.editReply({
        content: `✅ ${result.message}`,
      });
    } catch (error) {
      console.error("Error in rss-remove command:", error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
      });
    }
  },
};
