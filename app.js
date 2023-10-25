const express = require("express");
const cron = require("node-cron");
const { connectMongo } = require("./services/mongo");
const controller = require("./controller/mainController");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 8000;

const executeNewsJobsSequentially = async () => {
  console.info("NEWS: Executing a scheduled cronjob to scrape and send");
  await controller.runNewsScraper();
  await controller.sendNews();
};

const executeTrainJobsSequentially = async () => {
  console.info("TRAIN: Executing a scheduled cronjob to scrape and send");
  await controller.runTrainScraper();
  await controller.sendTrain();
}

function startApp() {
  console.info(`Server listening on port ${PORT}`);

  // Schedule the jobs after everything is set up
  cron.schedule("*/30 * * * *", executeNewsJobsSequentially);
  cron.schedule("*/5 * * * *", executeTrainJobsSequentially);
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

// Start the MongoDB connection
connectMongo()
  .then(() => {
    // Start listening after the MongoDB connection is established
    app.listen(PORT, startApp);
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
