const express = require("express");
const cron = require("node-cron");
const { connectMongo } = require("./services/mongo");
const controller = require("./controller/mainController");
const { discordLogin, botParams } = require("./services/discordBot");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

const jobQueue = [];

const addToQueue = (job) => {
  jobQueue.push(job);
  console.info('Job added to queue');
};

const processQueue = async () => {
  if (jobQueue.length > 0) {
    const job = jobQueue.shift();
    try {
      console.info('Processing job from queue');
      await job();
      console.info('Job processed successfully');
    } catch (error) {
      console.error('Error processing job:', error);
    }
  }
};

const executeNewsJobsSequentially = async () => {
  console.info("NEWS: Executing a scheduled cronjob to scrape and send");
  await controller.runNewsScraper();
  await controller.sendNews();
};

const executeTrainJobsSequentially = async () => {
  console.info("TRAIN: Executing a scheduled cronjob to scrape and send");
  await controller.runTrainScraper();
  await controller.sendTrain();
};

const executeFormulaJobsSequentially = async () => {
  console.info("FORMULA: Executing a scheduled cronjob to scrape and send");
  await controller.runFormulaScraper();
  await controller.sendFormula();
};

function startApp() {
  console.info(`Server listening on port ${PORT}`);
  console.info("Starting up the discord bot");
  discordLogin(botParams);
  connectMongo()

  if (process.env.ENV !== 'LOCAL') {
    console.info("Scheduling cronjobs on a non-local environment");
    cron.schedule("*/15 * * * *", () => addToQueue(executeNewsJobsSequentially));
    cron.schedule("*/5 * * * *", () => addToQueue(executeTrainJobsSequentially));
    // cron.schedule("*/30 * * * *", () => addToQueue(executeFormulaJobsSequentially));
  } else {
    console.info("Cronjobs not scheduled on a local environment");
  }

  setInterval(processQueue, 1000);  // Check the queue every second
}


// Endpoint to run the news scraper
app.get('/runNewsScraper', async (req, res) => {
  try {
    console.info('Running news scraper from endpoint');
    await controller.runNewsScraper();
    res.status(200).send('News scraper executed successfully.');
  } catch (error) {
    console.error('Failed to execute news scraper: ' + error.message);
    res.status(500).send('Failed to execute news scraper: ' + error.message);
  }
});

// Endpoint to send the news
app.get('/sendNews', async (req, res) => {
  try {
    console.info('Sending news from endpoint');
    await controller.sendNews();
    res.status(200).send('News sent successfully.');
  } catch (error) {
    console.error('Failed to send news: ' + error.message);
    res.status(500).send('Failed to send news: ' + error.message);
  }
});

app.listen(PORT, startApp);
