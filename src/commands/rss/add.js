const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const rssController = require("../../controller/rssController");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rss-add")
    .setDescription("Add an RSS feed to this server")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("The RSS feed URL")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to post updates to (defaults to current channel)")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const feedUrl = interaction.options.getString("url");
      const channel = interaction.options.getChannel("channel") || interaction.channel;

      const result = await rssController.addFeed(
        interaction.guildId,
        feedUrl,
        channel.id
      );

      await interaction.editReply({
        content: `✅ ${result.message}\n**Feed:** ${result.feedName}\n**Channel:** <#${channel.id}>`,
      });
    } catch (error) {
      console.error("Error in rss-add command:", error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
      });
    }
  },
};
