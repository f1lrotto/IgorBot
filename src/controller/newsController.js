const moment = require("moment-timezone");
moment.tz.setDefault("Europe/Bratislava");

const smeScraper = require("../newsScraper/smeScraper");
const articlesDatabase = require("../models/articles.mongo");

const SME_URL = "https://www.sme.sk/minuta/dolezite-spravy";

const newsScrapeJob = async () => {
  console.info("Starting the smeScraper");
  const articles = await smeScraper.scrapeOverview(SME_URL);
  console.info(`Scraped ${articles.length} articles from SME`);
  return articles;
};

const saveNewsToDatabase = async (articles) => {
  console.info(`Attempting to save ${articles.length} articles to database`);

  if (articles.length === 0) {
    console.info('No articles to save');
    return;
  }

  let saved = 0;
  let skipped = 0;

  // Use for...of instead of forEach to properly handle async/await
  for (const article of articles) {
    try {
      const articleExists = await articlesDatabase.exists({
        articleId: article.articleId,
      });

      if (!articleExists) {
        console.info(`Saving new article ${article.articleId}: ${article.headline.substring(0, 50)}...`);
        await articlesDatabase.create(article);
        saved++;
      } else {
        console.info(`Skipping existing article ${article.articleId}`);
        skipped++;
      }
    } catch (error) {
      console.error(`Error saving article ${article.articleId}:`, error.message);
    }
  }

  console.info(`Saved ${saved} articles to database, skipped ${skipped} articles`);
};

const getNewsUnsentArticles = async () => {
  // get all articles that were not sent yet and set wasSent to true
  console.info("Trying to retrieve unsent articles from database");
  const articles = await articlesDatabase
    .find({ wasSent: false })
    .lean()
    .exec();
  console.info(`Found ${articles.length} unsent articles`);

  if (articles.length > 0) {
    console.info(`Marking ${articles.length} articles as sent...`);
    // Use for...of instead of forEach to properly handle async/await
    for (const article of articles) {
      await articlesDatabase.updateOne({ _id: article._id }, { wasSent: true });
      console.info(`Marked article ${article.articleId} as sent`);
    }
  }

  // sort the articles by date from oldest to newest
  articles.sort((a, b) => {
    return new Date(b.articleTimestamp) - new Date(a.articleTimestamp);
  });
  return articles;
};

const getYesterdayNews = async () => {
  const yesterday = moment().subtract(1, "days");
  const yesterdayStart = yesterday.startOf("day").toDate();
  const yesterdayEnd = yesterday.endOf("day").toDate();
  const articles = await articlesDatabase
    .find({
      articleTimestamp: {
        $gte: yesterdayStart,
        $lt: yesterdayEnd,
      },
    })
    .lean()
    .exec();
  console.info(`Found ${articles.length} articles from yesterday`);
  return articles;
};

module.exports = {
  newsScrapeJob,
  saveNewsToDatabase,
  getNewsUnsentArticles,
  getYesterdayNews,
};
