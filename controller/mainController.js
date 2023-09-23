const { sendNewsDiscordMessage } = require("../services/discord");
const { newsScrapeJob, saveNewsToDatabase, getNewsUnsentArticles } = require("./newsController");

// NEWS N SCRAPER
const runNewsScraper = async () => {
  console.log("Running news scraper");
  const articles = await newsScrapeJob();
  await saveNewsToDatabase(articles);
  console.log("News scraper finished");
};

const sendNews = async () => {
  console.log("Sending news");
  const articles = await getNewsUnsentArticles();
  sendNewsDiscordMessage(articles);
  console.log("News sent");
};


module.exports = {
  runNewsScraper,
  sendNews,
};