const {
  sendNewsMessages,
  sendTrainMessages,
} = require("../services/messageDistributor");
const {
  newsScrapeJob,
  saveNewsToDatabase,
  getNewsUnsentArticles,
} = require("./newsController");
const {
  getTrainInfo,
  saveTrainInfoToDatabase,
  getUnesntTrains,
} = require("./trainController");

// NEWS N SCRAPER
const runNewsScraper = async () => {
  const articles = await newsScrapeJob();
  await saveNewsToDatabase(articles);
  console.info("News scraper finished");
  return 0;
};

const sendNews = async (client) => {
  console.info("Starting a job to send news to Discord servers");
  const articles = await getNewsUnsentArticles();
  if (articles.length === 0) {
    console.info("No news to send, 0 unsent articles found");
    return 1;
  }
  await sendNewsMessages(client, articles);
  console.info("News sent successfully");
  return 0;
};

// TRAINS :)
const runTrainScraper = async () => {
  const trains = await getTrainInfo();
  await saveTrainInfoToDatabase(trains);
  console.info("Train scraper finished");
  return 0;
};

const sendTrain = async (client) => {
  console.info("Starting a job to send train info to Discord servers");
  const trains = await getUnesntTrains();
  if (trains.length === 0) {
    console.info("No trains to send, 0 unsent trains found");
    return 1;
  }
  await sendTrainMessages(client, trains);
  console.info("Trains sent successfully");
  return 0;
};

module.exports = {
  runNewsScraper,
  sendNews,
  runTrainScraper,
  sendTrain,
};
