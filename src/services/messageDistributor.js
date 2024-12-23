const { EmbedBuilder } = require("discord.js");
const ServerConfig = require("../models/ServerConfig");
const moment = require("moment-timezone");

moment.tz.setDefault("Europe/Bratislava");

const sourceConfig = {
  SME: {
    color: 0xd45959,
    url: "https://www.sme.sk/minuta/dolezite-spravy",
    iconURL: "https://cdn.discordapp.com/attachments/1320838726603112568/1320851067847835719/331729766_1659510097825524_2275160154005558333_n.png?ex=676b19ea&is=6769c86a&hm=9c95ec3ec8630a9df75b2f472e401d964ad53e469cbad4fd361d301735b3c736&",
    name: "SME"
  }
  // Add other sources here in the future
};

function createNewsEmbed(article) {
  const category = article.category || "Uncategorized";
  const source = article.source || "Unknown";
  const sourceSettings = sourceConfig[source] || {
    color: 0x808080,
    url: "https://example.com",
    iconURL: "https://example.com/default-icon.png",
    name: "Unknown Source"
  };

  const fields = [];
  
  // Add category field
  fields.push({ 
    name: "Kategória", 
    value: category,
    inline: true 
  });

  // Add themes if they exist
  if (article.theme && article.theme.length > 0) {
    const name = article.theme.length > 1 ? "Témy" : "Téma";
    fields.push({ 
      name, 
      value: article.theme.join("\n"), 
      inline: true 
    });
  }

  return new EmbedBuilder()
    .setColor(sourceSettings.color)
    .setTitle(article.headline)
    .setURL(article.articleUrl)
    .setAuthor({
      name: sourceSettings.name,
      url: sourceSettings.url,
      iconURL: sourceSettings.iconURL
    })
    .setDescription(article.articleContent)
    .addFields(fields)
    .setImage(article.img)
    .setTimestamp(
      moment(
        `${article.articleDate} ${article.articleTime}`,
        "DD. MM. YYYY HH:mm"
      ).toDate()
    );
}

function createTrainEmbed(train) {
  return new EmbedBuilder()
    .setColor(0xfc9d03)
    .setTitle(train.content)
    .setURL(train.url)
    .setAuthor({
      name: "Železničná spoločnosť Slovensko",
      url: "https://mastodon.social/@zssk_mimoriadne",
      iconURL: config.train.avatarURL,
    })
    .setTimestamp(new Date(moment(train.date).toISOString()))
    .setFooter({ text: "ZSSK" });
}

const distributeMessages = async (client, channelType, messages, createEmbed) => {
  try {
    // Get all server configurations that have this type of channel configured
    const configs = await ServerConfig.find({
      [`channels.${channelType}`]: { $ne: null },
    })
      .lean()
      .exec();

    // Create embeds for each item
    const embeds = messages.map((item) => createEmbed(item));

    // Send to each configured channel
    for (const config of configs) {
      const channelId = config.channels[channelType];
      const channel = await client.channels.fetch(channelId);

      if (!channel) {
        console.log(
          `Channel ${channelId} not found for guild ${config.guildId}`
        );
        continue;
      }

      // Send each embed individually
      for (const embed of embeds) {
        await channel.send({ embeds: [embed] });
      }
    }
  } catch (error) {
    console.error(`Error distributing ${channelType} messages:`, error);
  }
};

const distributePlainMessage = async (client, channelType, message) => {
  try {
    const servers = await ServerConfig.find({
      [`channels.${channelType}`]: { $ne: null },
    }).lean();

    if (servers.length === 0) {
      console.info(`No servers configured for ${channelType}`);
      return;
    }

    for (const server of servers) {
      const channelId = server.channels[channelType];
      const channel = await client.channels.fetch(channelId);
      
      if (channel) {
        await channel.send({
          content: message,
          flags: ['SuppressEmbeds']
        });
        console.info(`Message sent to server ${server.guildId} for ${channelType}`);
      }
    }
  } catch (error) {
    console.error(`Error sending message for ${channelType}:`, error);
  }
};

module.exports = {
  async sendNewsMessages(client, articles) {
    await distributeMessages(client, "news", articles, createNewsEmbed);
  },

  async sendTrainMessages(client, trains) {
    await distributeMessages(client, "train", trains, createTrainEmbed);
  },

  async sendMorningNewsMessages(client, report) {
    await distributePlainMessage(client, "morning-news", report);
  },
};
