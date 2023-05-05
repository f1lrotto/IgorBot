const { sendDennikDiscordMessage } = require("../services/discord");
const { dennikScrapeJob, saveDennikToDatabase, getDennikUnsentArticles } = require("./dennikController");
const { zsskScrapeJob, saveToZsskDatabase, getZsskUnsentArticles } = require("./zsskController");

// DENNIK N SCRAPER
const runDennikScraper = async () => {
  const articles = await dennikScrapeJob();
  await saveDennikToDatabase(articles);
};

const sendDennik = async () => {
  const articles = await getDennikUnsentArticles();
  sendDennikDiscordMessage(articles);
};

// ZSSK SCRAPER
const runZsskScraper = async () => {
  const zsskTweets = await zsskScrapeJob();
  await saveToZsskDatabase(zsskTweets);
};

const sendZssk = async () => {
  const zsskTweets = await getZsskUnsentArticles();
  sendZsskDiscordMessage(zsskTweets);
};

module.exports = {
  runDennikScraper,
  sendDennik,
  runZsskScraper,
  sendZssk,
};