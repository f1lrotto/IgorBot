const { EmbedBuilder } = require("discord.js");
const ServerConfig = require("../models/ServerConfig");
const moment = require("moment-timezone");

moment.tz.setDefault("Europe/Bratislava");

const articleCategoryConfig = {
  Domov: {
    color: 0xc73636,
    categoryUrl: "https://www.sme.sk/minuta/rubrika/7761/domov",
    iconURL:
      "https://cdn.discordapp.com/attachments/457885524292665348/1154878264049930250/image.png",
  },
  Svet: {
    color: 0xd9d918,
    categoryUrl: "https://www.sme.sk/minuta/rubrika/7763/svet",
    iconURL:
      "https://cdn.discordapp.com/attachments/457885524292665348/1154879552733061120/image.png",
  },
  Ekonomika: {
    color: 0x207ae3,
    categoryUrl: "https://www.sme.sk/minuta/rubrika/7764/ekonomika",
    iconURL:
      "https://cdn.discordapp.com/attachments/457885524292665348/1154878891941433458/image.png",
  },
  Regióny: {
    color: 0x972fd4,
    categoryUrl: "https://www.sme.sk/minuta/rubrika/7768/regiony",
    iconURL:
      "https://cdn.discordapp.com/attachments/457885524292665348/1154880664173301760/image.png",
  },
};

function createNewsEmbed(article) {
  const category = article.category || "Uncategorized";
  const config = articleCategoryConfig[category] || {
    color: 0x808080,
    iconURL: "https://example.com/default-icon.png",
  };

  return new EmbedBuilder()
    .setColor(config.color || 0x4f2b04)
    .setTitle(article.headline)
    .setURL(article.articleUrl)
    .setAuthor({
      name: article.category,
      url: config.categoryUrl,
      iconURL: config.iconURL,
    })
    .setDescription(article.articleContent)
    .addFields(fields)
    .setImage(article.img)
    .setTimestamp(
      moment(
        `${article.articleDate} ${article.articleTime}`,
        "DD. MM. YYYY HH:mm"
      ).toDate()
    )
    .setFooter({
      text: "SME.sk",
      iconURL:
        "https://cdn.discordapp.com/attachments/1152608374588981329/1154165287197880410/image0.jpg",
    });
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

async function distributeMessages(client, type, items, createEmbed) {
  try {
    // Get all server configurations that have this type of channel configured
    const configs = await ServerConfig.find({
      [`channels.${type}`]: { $ne: null },
    })
      .lean()
      .exec();

    // Create embeds for each item
    const embeds = items.map((item) => createEmbed(item));

    // Send to each configured channel
    for (const config of configs) {
      const channelId = config.channels[type];
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
    console.error(`Error distributing ${type} messages:`, error);
  }
}

module.exports = {
  async sendNewsMessages(client, articles) {
    await distributeMessages(client, "news", articles, createNewsEmbed);
  },

  async sendTrainMessages(client, trains) {
    await distributeMessages(client, "train", trains, createTrainEmbed);
  },
};
