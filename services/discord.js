const { WebhookClient, EmbedBuilder } = require("discord.js");
const moment = require("moment-timezone");
const dotenv = require("dotenv");
dotenv.config();
moment.tz.setDefault("Europe/Bratislava");

const config = {
  news: {
    discordURL: process.env.NEWS_DISCORD_URL,
    username: "Memečiar",
    avatarURL: "https://cdn.discordapp.com/attachments/457885524292665348/1154872367995162634/image.png"
  },
  train: {
    discordURL: process.env.TRAIN_DISCORD_URL,
    username: "NestiháčikVláčik",
    avatarURL: "https://cdn.discordapp.com/attachments/457885524292665348/1166862329904898068/thomas-the-tank-engine-screaming-as-he-travels-through-v0-eeux64f7ahha1.png?ex=654c083a&is=6539933a&hm=1f4e63a5ff71421b8ca3689280e0ef2d3b28ebb986fcb67a92ecd9733b25b46d&"
  },
  formula: {
    discordURL: process.env.FORMULA_DISCORD_URL,
    username: "hihi:)",
    avatarURL: "https://media.discordapp.net/attachments/1000236490133090355/1168283077408211025/F1-Instagram-1280x720.jpg?ex=65513367&is=653ebe67&hm=bdabe2ab1982e7d0916921c8e11a96bac539305787f71c09dfbd60b6cbc19836&=&width=1202&height=676"
  }
};

const webhookClients = {
  news: new WebhookClient({ url: config.news.discordURL }),
  train: new WebhookClient({ url: config.train.discordURL }),
  formula: new WebhookClient({ url: config.formula.discordURL })
};

const articleCategoryConfig = {
  'Domov': {
    color: 0xc73636,
    categoryUrl: 'https://www.sme.sk/minuta/rubrika/7761/domov',
    iconURL: 'https://cdn.discordapp.com/attachments/457885524292665348/1154878264049930250/image.png'
  },
  'Svet': {
    color: 0xd9d918,
    categoryUrl: 'https://www.sme.sk/minuta/rubrika/7763/svet',
    iconURL: 'https://cdn.discordapp.com/attachments/457885524292665348/1154879552733061120/image.png'
  },
  'Ekonomika': {
    color: 0x207ae3,
    categoryUrl: 'https://www.sme.sk/minuta/rubrika/7764/ekonomika',
    iconURL: 'https://cdn.discordapp.com/attachments/457885524292665348/1154878891941433458/image.png'
  },
  'Regióny': {
    color: 0x972fd4,
    categoryUrl: 'https://www.sme.sk/minuta/rubrika/7768/regiony',
    iconURL: 'https://cdn.discordapp.com/attachments/457885524292665348/1154880664173301760/image.png'
  },
  'Šport': {
    color: 0x229e06,
    categoryUrl: 'https://www.sme.sk/minuta/rubrika/7765/sport',
    iconURL: 'https://cdn.discordapp.com/attachments/457885524292665348/1154879086351630416/image.png'
  },
};

async function sendDiscordMessage(clientConfig, items, createEmbed) {
  if (items.length === 0) return;
  console.info(`Attempting to send ${items.length} items to Discord`);
  const embeds = items.map(createEmbed);

  // sort the embeds by date from oldest to newest
  embeds.sort((a, b) => {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });

  // send the embeds to the discord channel in 10 piece batches
  for (let i = 0; i < embeds.length; i += 10) {
    const batch = embeds.slice(i, i + 10);
    console.info(`Sending ${batch.length} embeds in batch ${Math.floor(i / 10) + 1}`);
    await webhookClients[clientConfig].send({
      username: config[clientConfig].username,
      avatarURL: config[clientConfig].avatarURL,
      embeds: batch,
    });
  }
}

function createNewsEmbed(article) {
  const categoryConfig = articleCategoryConfig[article.category] || {};
  const combinedDateTime = `${moment(article.articleDate, 'DD. M. YYYY').format('DD/MM/YYYY')} ${article.articleTime}`;
  const unixTimestamp = moment(combinedDateTime, 'DD/MM/YYYY HH:mm').toISOString();

  const fields = [];
  if (article.theme && article.theme.length > 0) {
    const name = article.theme.length > 1 ? 'Témy' : 'Téma';
    fields.push({ name, value: article.theme.join('\n'), inline: true });
  }

  return new EmbedBuilder()
    .setColor(categoryConfig.color || 0x4f2b04)
    .setTitle(article.headline)
    .setURL(article.articleUrl)
    .setAuthor({ name: article.category, url: categoryConfig.categoryUrl, iconURL: categoryConfig.iconURL })
    .setDescription(article.articleContent)
    .addFields(fields)
    .setImage(article.img)
    .setTimestamp(new Date(unixTimestamp))
    .setFooter({ text: 'SME.sk', iconURL: 'https://cdn.discordapp.com/attachments/1152608374588981329/1154165287197880410/image0.jpg' });
}

function createTrainEmbed(train) {
  return new EmbedBuilder()
    .setColor(0xfc9d03)
    .setTitle(train.content)
    .setURL(train.url)
    .setAuthor({ name: 'Železničná spoločnosť Slovensko', url: 'https://mastodon.social/@zssk_mimoriadne', iconURL: config.train.avatarURL })
    .setTimestamp(new Date(moment(train.date).toISOString()))
    .setFooter({ text: 'ZSSK' });
}

function createFormulaEmbed(article) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(article.title)
    .setURL(article.url)
    .setAuthor({ name: article.tag, url: 'https://www.formula1.com/en/latest/all.html#default', iconURL: config.formula.avatarURL })
    .setTimestamp(new Date(article.scrapeDate))
    .setFooter({ text: 'Formula1.com' });
}


module.exports = {
  sendNewsDiscordMessage: async (articles) => sendDiscordMessage('news', articles, createNewsEmbed),
  sendTrainDiscordMessage: async (trains) => sendDiscordMessage('train', trains, createTrainEmbed),
  sendFormulaDiscordMessage: async (articles) => sendDiscordMessage('formula', articles, createFormulaEmbed),
};
