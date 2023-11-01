const { sendNewsDiscordMessage, sendTrainDiscordMessage, sendFormulaDiscordMessage } = require("../services/discordWebhook");
const { newsScrapeJob, saveNewsToDatabase, getNewsUnsentArticles } = require("./newsController");
const { getTrainInfo, saveTrainInfoToDatabase, getUnesntTrains } = require("./trainController");
const { formulaScrapeJob, saveFormulaToDatabase, getUnsentFormula } = require("./formulaController");

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

// TRAINS :)
const runTrainScraper = async () => {
  const trains = await getTrainInfo();
  await saveTrainInfoToDatabase(trains);
  console.info("Train scraper finished");
  return 0;
};

const sendTrain = async () => {
  console.info("Starting a job to send train info to a discord server");
  const trains = await getUnesntTrains();
  if (trains.length === 0) {
    console.info("No trains to send, 0 unsent trains found");
    return 1;
  }
  sendTrainDiscordMessage(trains);
  console.info("Trains sent successfully");

  return 0;
}

// FORMULA 1
const runFormulaScraper = async () => {
  const articles = await formulaScrapeJob();
  await saveFormulaToDatabase(articles);
  console.info("Formula scraper finished");
  return 0;
};

const sendFormula = async () => {
  console.info("Starting a job to send formula news to a discord server");
  const articles = await getUnsentFormula();
  if (articles.length === 0) {
    console.info("No formula news to send, 0 unsent articles found");
    return 1;
  }
  sendFormulaDiscordMessage(articles);
  console.info("Formula news sent successfully");

  return 0;
};


module.exports = {
  runNewsScraper,
  sendNews,
  runTrainScraper,
  sendTrain,
  runFormulaScraper,
  sendFormula,
};