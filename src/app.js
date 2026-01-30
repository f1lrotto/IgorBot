const express = require("express");
const cron = require("node-cron");
const { connectMongo } = require("./services/mongo");
const rssController = require("./controller/rssController");
const smeRssAdapter = require("./services/smeRssAdapter");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;
const isLocal = process.env.NODE_ENV === "development";

async function startApp() {
  try {
    console.info("Connecting to MongoDB...");
    await connectMongo();
    console.info("MongoDB connected successfully");

    await smeRssAdapter.initialize();

    app.listen(PORT, () => {
      console.info(`Server listening on port ${PORT}`);
    });

    if (!isLocal) {
      console.info("Scheduling RSS polling cron job for production environment");
      
      cron.schedule("*/5 * * * *", async () => {
        console.info("Running RSS feed check...");
        try {
          const results = await rssController.checkAllFeeds();
          const totalNewItems = results.reduce((sum, r) => sum + (r.newItemsCount || 0), 0);
          console.info(`RSS check complete. Found ${totalNewItems} new items across ${results.length} feeds`);
        } catch (error) {
          console.error("Error during RSS feed check:", error);
        }
      });
    } else {
      console.info("Running in development mode - RSS polling disabled");
    }
  } catch (error) {
    console.error("Failed to start the application:", error);
    process.exit(1);
  }
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/check-feeds", async (req, res) => {
  try {
    console.info("Manual RSS feed check triggered");
    const results = await rssController.checkAllFeeds();
    res.status(200).json({
      message: "RSS feed check completed",
      results: results.map((r) => ({
        feedName: r.feedName,
        success: r.success,
        newItemsCount: r.newItemsCount,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("Error during manual RSS feed check:", error);
    res.status(500).json({ error: "Failed to check RSS feeds" });
  }
});

startApp();
