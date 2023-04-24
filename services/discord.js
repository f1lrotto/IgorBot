const { WebhookClient } = require("discord.js");

const {makeDennikDiscordMessage, makeZsskDiscordMessage} = require("./../controller/discord.send");

require("dotenv").config();

const DENNIK_DISCORD_URL = process.env.DENNIK_DISCORD_URL;
const DENNIK_DISCORD_USERNAME = "Igor";
const DENNIK_DISCORD_AVATAR_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7hdRR2Z7DLOus03pQvQsq1XRwmsxGMAJ61A&usqp=CAU";

const ZSSK_DISCORD_URL = process.env.ZSSK_DISCORD_URL;
const ZSSK_DISCORD_USERNAME = ""; // TODO MILAN
const ZSSK_DISCORD_AVATAR_URL = "";

const dennikWebhookClient = new WebhookClient({ url: DENNIK_DISCORD_URL });
const zsskWebhookClient = new WebhookClient({ url: ZSSK_DISCORD_URL });

function sendDennikDiscordMessage(newArticles) {
  if (newArticles.length != 0) {
    const newArticleArray = makeDennikDiscordMessage(newArticles);
    const numMessages = Math.ceil(newArticleArray.length / 10);
    var countStart = 0;
    var countEnd = 9;
    for (let i = 0; i < numMessages; i++) {
      if (countEnd > newArticleArray) {
        countEnd = newArticleArray.length;
      }

      message = newArticleArray.slice(countStart, countEnd).join(' ')
      dennikWebhookClient.send({
        content: message,
        username: DENNIK_DISCORD_USERNAME,
        avatarURL: DENNIK_DISCORD_AVATAR_URL,
      });
      countStart += 10;
      countEnd += 10;
    }
  }
}

function sendZsskDiscordMessage() { }; // TODO MILAN

module.exports = {
  sendDennikDiscordMessage,
  sendZsskDiscordMessage,
};
