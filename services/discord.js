const { WebhookClient } = require("discord.js");

const send = require("../controller/discord.send");

require("dotenv").config();

const NEWS_DISCORD_URL = process.env.NEWS_DISCORD_URL;
const NEWS_DISCORD_USERNAME = "KapustaKlaxon";
const NEWS_DISCORD_AVATAR_URL = "https://i1.wp.com/www.zdrowewarzywka.pl/wp-content/uploads/2018/06/kapusta-bia%C5%82a.jpg?fit=1024%2C683&ssl=1";

const newsWebhookClient = new WebhookClient({ url: NEWS_DISCORD_URL });

async function sendNewsDiscordMessage(newArticles) {
  if (newArticles.length !== 0) {
    const newArticleArray = send.makeNewsDiscordMessage(newArticles);

    for (const article of newArticleArray) {
      if (article.length <= 2000) {
        await newsWebhookClient.send({
          content: article,
          username: NEWS_DISCORD_USERNAME,
          avatarURL: NEWS_DISCORD_AVATAR_URL,
          embeds: [],
        });

        // Introducing a delay of 1 second between messages to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.error("Message too long!");
      }
    }
  }
}




module.exports = {
  sendNewsDiscordMessage,
};
