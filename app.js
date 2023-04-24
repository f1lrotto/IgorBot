const express = require("express");
const cron = require("node-cron");

const { connectMongo } = require("./services/mongo");
const scraperController = require("./controller/mainController");

require("dotenv").config();

connectMongo();

const app = express();

cron.schedule("*/1 * * * *", () => {
  console.log("Running main Cron Job");
  scraperController.runDennikScraper();

  scraperController.runZsskScraper();
});

cron.schedule("*/15 * * * *", () => {
  console.log("Running Discord Cron Job");
  //scraperController.sendDennik();
  //scraperController.sendZssk();
});

PORT = process.env.PORT || 8000;

app.listen(PORT, console.log(`Server listening on port ${PORT}`));
