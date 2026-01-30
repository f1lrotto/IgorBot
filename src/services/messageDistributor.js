const { EmbedBuilder } = require("discord.js");
const moment = require("moment-timezone");

moment.tz.setDefault("Europe/Bratislava");

function getDiscordBot() {
  return require("./discordBot");
}

function createRssEmbed(item, feed) {
  const style = feed.cardStyle || {};
  const color = parseInt(style.color?.replace("#", ""), 16) || 0xd45959;
  const maxLength = style.maxDescriptionLength || 300;
  
  let description = item.description || "";
  description = description.replace(/<[^>]*>/g, "");
  
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + "...";
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(item.title)
    .setURL(item.link)
    .setAuthor({
      name: feed.feedName,
      url: feed.feedUrl,
      iconURL: feed.feedIcon || undefined,
    });

  if (description) {
    embed.setDescription(description);
  }

  if (style.showImage !== false && item.imageUrl) {
    embed.setImage(item.imageUrl);
  }

  if (style.showTimestamp !== false) {
    embed.setTimestamp(item.pubDate);
  }

  if (item.categories && item.categories.length > 0) {
    embed.addFields({
      name: "Categories",
      value: item.categories.slice(0, 5).join(", "),
      inline: true,
    });
  }

  return embed;
}

class MessageDistributor {
  async sendRssItems(feed, items) {
    try {
      const client = getDiscordBot().getClient();
      
      if (!client) {
        console.error("Discord client not available");
        return;
      }

      const channel = await client.channels.fetch(feed.channelId);
      
      if (!channel) {
        console.error(`Channel ${feed.channelId} not found for feed ${feed.feedName}`);
        return;
      }

      for (const item of items) {
        const embed = createRssEmbed(item, feed);
        
        try {
          await channel.send({ embeds: [embed] });
          
          item.wasSent = true;
          await item.save();
          
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (sendError) {
          console.error(`Error sending item ${item.guid}:`, sendError);
        }
      }

      console.info(`Sent ${items.length} items from "${feed.feedName}" to channel ${feed.channelId}`);
    } catch (error) {
      console.error(`Error distributing RSS items for feed ${feed.feedName}:`, error);
    }
  }

  async sendRssItemPreview(feed, item) {
    try {
      const client = getDiscordBot().getClient();
      
      if (!client) {
        console.error("Discord client not available");
        return null;
      }

      const embed = createRssEmbed(item, feed);
      return embed;
    } catch (error) {
      console.error("Error creating RSS preview:", error);
      return null;
    }
  }
}

module.exports = new MessageDistributor();
