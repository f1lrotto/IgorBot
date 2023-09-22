const { sendNewsDiscordMessage } = require("../services/discord");
const { newsScrapeJob, saveNewsToDatabase, getNewsUnsentArticles } = require("./newsController");

// NEWS N SCRAPER
const runNewsScraper = async () => {
  console.log("Running news scraper");
  const articles = await newsScrapeJob();
  await saveNewsToDatabase(articles);
};

const sendNews = async () => {
  console.log("Sending news");
  const articles = await getNewsUnsentArticles();
  sendNewsDiscordMessage(articles);
};


module.exports = {
  runNewsScraper,
  sendNews,
};