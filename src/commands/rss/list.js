const { SlashCommandBuilder } = require("discord.js");
const rssController = require("../../controller/rssController");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rss-list")
    .setDescription("List all RSS feeds for this server"),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const feeds = await rssController.listFeeds(interaction.guildId);

      if (feeds.length === 0) {
        await interaction.editReply({
          content: "📭 No RSS feeds configured for this server. Use `/rss-add` to add one!",
        });
        return;
      }

      const feedList = feeds
        .map((feed) => {
          const status = feed.isActive ? "🟢" : "🔴";
          const lastChecked = feed.lastChecked
            ? new Date(feed.lastChecked).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Never";

          return `${status} **${feed.name}**\n   ID: \`${feed.id}\`\n   URL: ${feed.url}\n   Channel: <#${feed.channelId}>\n   Last checked: ${lastChecked}`;
        })
        .join("\n\n");

      await interaction.editReply({
        content: `📰 **RSS Feeds for this server**\n\n${feedList}`,
      });
    } catch (error) {
      console.error("Error in rss-list command:", error);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
      });
    }
  },
};
