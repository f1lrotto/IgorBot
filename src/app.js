const express = require("express");
const cron = require("node-cron");
const { connectMongo } = require("./services/mongo");
const controller = require("./controller/mainController");
const { client } = require("./services/discordBot");
const { engine } = require('express-handlebars');
const { getMorningNews } = require('./controller/morningReportController');
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;
const isLocal = process.env.NODE_ENV === "development";

// Set up Handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main',
  helpers: {
    add: (a, b) => a + b,
    subtract: (a, b) => a - b
  }
}));
app.set('view engine', 'handlebars');
app.set('views', './src/views');

const jobQueue = [];

const addToQueue = (job) => {
  jobQueue.push(job);
  console.info("Job added to queue");
};

const processQueue = async () => {
  if (jobQueue.length > 0) {
    const job = jobQueue.shift();
    try {
      console.info("Processing job from queue");
      await job();
      console.info("Job processed successfully");
    } catch (error) {
      console.error("Error processing job:", error);
    }
  }
};

const executeNewsJobsSequentially = async () => {
  console.info("NEWS: Executing a scheduled cronjob to scrape and send");
  await controller.runNewsScraper();
  await controller.sendNews(client);
};

const executeTrainJobsSequentially = async () => {
  console.info("TRAIN: Executing a scheduled cronjob to scrape and send");
  await controller.runTrainScraper();
  await controller.sendTrain(client);
};

const sendMorningNews = async () => {
  console.info("Sending morning news");
  await controller.morningNews(client);
};

async function startApp() {
  try {
    console.info("Connecting to MongoDB...");
    await connectMongo();
    console.info("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.info(`Server listening on port ${PORT}`);
    });

    // Schedule jobs only in production
    if (!isLocal) {
      console.info("Scheduling cron jobs for production environment");
      cron.schedule("*/15 * * * *", () =>
        addToQueue(executeNewsJobsSequentially)
      );
      cron.schedule("*/15 * * * *", () =>
        addToQueue(executeTrainJobsSequentially)
      );
      cron.schedule("0 6 * * *", () => addToQueue(sendMorningNews));

      // Process queue every minute
      setInterval(processQueue, 60000);

      // Start processing immediately
      processQueue();
    } else {
      console.info("Running in development mode - cron jobs disabled");
    }
  } catch (error) {
    console.error("Failed to start the application:", error);
    process.exit(1);
  }
}

// Endpoint to run the news scraper
app.get("/runNewsScraper", async (req, res) => {
  try {
    // await controller.runNewsScraper();
    await controller.sendNews(client);
    res.status(200).json({ message: "News scraper executed successfully" });
  } catch (error) {
    console.error("Error running news scraper:", error);
    res.status(500).json({ error: "Failed to run news scraper" });
  }
});

app.get("/runMorningNews", async (req, res) => {
  try {
    await controller.morningNews(client);
    res.status(200).json({ message: "Morning news sent successfully" });
  } catch (error) {
    console.error("Error sending morning news:", error);
    res.status(500).json({ error: "Failed to send morning news" });
  }
});

// Endpoint to run the train scraper
app.get("/runTrainScraper", async (req, res) => {
  try {
    await controller.runTrainScraper();
    await controller.sendTrain(client);
    res.status(200).json({ message: "Train scraper executed successfully" });
  } catch (error) {
    console.error("Error running train scraper:", error);
    res.status(500).json({ error: "Failed to run train scraper" });
  }
});

// Morning news route
app.get('/morning-news', getMorningNews);

startApp();
