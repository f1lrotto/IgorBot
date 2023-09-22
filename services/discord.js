const { WebhookClient, EmbedBuilder } = require("discord.js");

require("dotenv").config();

const NEWS_DISCORD_URL = process.env.NEWS_DISCORD_URL;
const NEWS_DISCORD_USERNAME = "Memečiar";
const NEWS_DISCORD_AVATAR_URL = "https://cdn.discordapp.com/attachments/457885524292665348/1154872367995162634/image.png";

const newsWebhookClient = new WebhookClient({ url: NEWS_DISCORD_URL });

async function sendNewsDiscordMessage(newArticles) {
  if (newArticles.length !== 0) {
    console.log(`Sending ${newArticles.length} new articles to Discord`);
    const embeds = [];
    
    newArticles.forEach((article) => {
      let color = '';
      let categoryUrl = '';
      let iconURL = 'https://cdn.discordapp.com/attachments/457885524292665348/1154878673179119686/image.png';
      switch (article.category) {
        case 'Domov':
          color = 0xc73636;
          categoryUrl = 'https://www.sme.sk/minuta/rubrika/7761/domov'
          iconURL = 'https://cdn.discordapp.com/attachments/457885524292665348/1154878264049930250/image.png'
          break;
        case 'Svet':
          color = 0xd9d918;
          categoryUrl = 'https://www.sme.sk/minuta/rubrika/7763/svet'
          iconURL = 'https://cdn.discordapp.com/attachments/457885524292665348/1154879552733061120/image.png'
          break;
        case 'Ekonomika':
          color = 0x207ae3;
          categoryUrl = 'https://www.sme.sk/minuta/rubrika/7764/ekonomika'
          iconURL = 'https://cdn.discordapp.com/attachments/457885524292665348/1154878891941433458/image.png'
          break;
        case 'Regióny':
          color = 0x972fd4;
          categoryUrl = 'https://www.sme.sk/minuta/rubrika/7768/regiony'
          iconURL = 'https://cdn.discordapp.com/attachments/457885524292665348/1154880664173301760/image.png'
          break;
        case 'Šport':
          color = 0x229e06;
          categoryUrl = 'https://www.sme.sk/minuta/rubrika/7765/sport'
          iconURL = 'https://cdn.discordapp.com/attachments/457885524292665348/1154879086351630416/image.png'
          break;
        default:
          color = 0x4f2b04
          break;
      }

      const fields = [
        { name: 'Dátum & Čas', value: `${article.articleTime}\n*${article.articleDate}*`, inline: true },
      ];

      if (article.theme && article.theme.length > 0) {
        const name = article.theme.length > 1 ? 'Témy' : 'Téma';
        fields.push({ name, value: article.theme.join('\n'), inline: true });
      }

      if (article.headline.includes('Mazurek')) {
        article.headline = article.headline.replace('Mazurek', '🥚 Mazurek 🥚')
      }
      if (article.articleContent.includes('Mazurek')) {
        article.articleContent = article.articleContent.replace('Mazurek', '🥚 Mazurek 🥚')
      }

      const exampleEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(article.headline)
        .setURL(article.articleUrl)
        .setAuthor({ name: article.category, url: categoryUrl, iconURL })
        .setDescription(article.articleContent)
        .addFields(fields)
        .setImage(article.img)
        .setTimestamp()
        .setFooter({ text: 'Maslo', iconURL: 'https://cdn.discordapp.com/attachments/1152608374588981329/1154165287197880410/image0.jpg' });
      console.log('Created embed');      
      embeds.push(exampleEmbed);
    });

    // send the embed to the discord channel in 10 piece batches
    let a = 0;
    let b = 10;
    for (let i = 0; i < embeds.length; i += 10) {
      const current = embeds.slice(a, b);
      if (!current) break;
      console.log(`Sending ${current.length} embeds in batch ${i / 10}`);
      await newsWebhookClient.send({
        username: NEWS_DISCORD_USERNAME,
        avatarURL: NEWS_DISCORD_AVATAR_URL,
        embeds: current,
      });
      a += 10;
      b += 10;
    }    
  }
}

module.exports = {
  sendNewsDiscordMessage,
};
