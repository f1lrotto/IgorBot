const express = require("express");
const cron = require("node-cron");
const { connectMongo } = require("./services/mongo");
const controller = require("./controller/mainController");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 8000;

function startApp() {
  const executeJobsSequentially = async () => {
    console.log("Running jobs");
    await controller.runNewsScraper();
    await controller.sendNews();
  };

  // Schedule the jobs after everything is set up
  cron.schedule("*/5 * * * *", executeJobsSequentially);

  console.log(`Server listening on port ${PORT}`);
}

// Endpoint to run the news scraper
app.get('/runNewsScraper', async (req, res) => {
  try {
    await controller.runNewsScraper();
    res.status(200).send('News scraper executed successfully.');
  } catch (error) {
    res.status(500).send('Failed to execute news scraper: ' + error.message);
  }
});

// Endpoint to send the news
app.get('/sendNews', async (req, res) => {
  try {
    await controller.sendNews();
    res.status(200).send('News sent successfully.');
  } catch (error) {
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
