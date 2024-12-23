const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const ServerConfig = require("../../models/ServerConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("Set a channel for a specific news type")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of news")
        .setRequired(true)
        .addChoices(
          { name: "News", value: "news" },
          { name: "Morning news", value: "morning-news" },
          { name: "Train", value: "train" }
        )
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to send messages to")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    try {
      const type = interaction.options.getString("type");
      const channel = interaction.options.getChannel("channel");

      let config = await ServerConfig.findOne({ guildId: interaction.guildId });

      if (!config) {
        config = new ServerConfig({ guildId: interaction.guildId });
      }

      config.channels[type] = channel.id;
      await config.save();

      await interaction.reply({
        content: `Successfully set ${type} messages to be sent to ${channel}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in setchannel command:", error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  },
};
