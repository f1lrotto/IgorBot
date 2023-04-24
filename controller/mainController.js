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
  const articles = await zsskScrapeJob();
  await saveToZsskDatabase(articles);
};

const sendZssk = async () => {
  const articles = await getZsskUnsentArticles();
  sendZsskDiscordMessage(articles);
};

module.exports = {
  runDennikScraper,
  sendDennik,
  runZsskScraper,
  sendZssk,
};