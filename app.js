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
