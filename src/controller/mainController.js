const { sendNewsDiscordMessage } = require("../services/discord");
const { newsScrapeJob, saveNewsToDatabase, getNewsUnsentArticles } = require("./newsController");
const { redditScrapeJob, saveRedditToDatabase, getRedditUnsentStories, makeTTS } = require("./redditController");
const { produceVideo } = require("./videoController");
const path = require('path');
const fs = require('fs');

// NEWS SCRAPER
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

// REDDIT SCRAPER FOR TIKTOK
const runRedditScraper = async () => {
  console.info("Starting the Reddit scraper");
  const stories = await redditScrapeJob();
  console.info(`Scraped ${stories.length} stories`);
  await saveRedditToDatabase(stories);
  return stories;
};

const removeFileWithRetry = (filePath, retries = 3, delay = 1000) => {
  return new Promise((resolve, reject) => {
    const attemptDeletion = (attemptsLeft) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          if (attemptsLeft > 0) {
            setTimeout(() => attemptDeletion(attemptsLeft - 1), delay);
          } else {
            console.error(`Failed to delete ${filePath} after multiple attempts.`);
            reject(err);
          }
        } else {
          resolve();
        }
      });
    };

    attemptDeletion(retries);
  });
};

const makeVideo = async () => {
  // first get all the stories from the database that weren't sent yet
  const stories = await getRedditUnsentStories();
  const afterTTSStories = await makeTTS(stories);
  await produceVideo(afterTTSStories);
};



module.exports = {
  runNewsScraper,
  sendNews,
  runRedditScraper,
  makeVideo,
};