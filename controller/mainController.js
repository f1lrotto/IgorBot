const { sendNewsDiscordMessage } = require("../services/discord");
const { newsScrapeJob, saveNewsToDatabase, getNewsUnsentArticles } = require("./newsController");

// NEWS N SCRAPER
const runNewsScraper = async () => {
  const articles = await newsScrapeJob();
  await saveNewsToDatabase(articles);
  console.info("News scraper finished");
  return 0;
};

const sendNews = async () => {
  console.info("Starting a job to send news to a discord server");
  const articles = await getNewsUnsentArticles();
  if (articles.length === 0) {
    console.info("No news to send, 0 unsent articles found");
    return 1;
  }
  sendNewsDiscordMessage(articles);
  console.info("News sent successfully");

  return 0;
};


module.exports = {
  runNewsScraper,
  sendNews,
};