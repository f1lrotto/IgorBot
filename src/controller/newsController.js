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
  console.info("Attempting to save articles to database");
  let coutner = 0;
  // save to database, but if already in mongo database, don't save
  articles.forEach(async (article) => {
    const articleExists = await articlesDatabase.exists({
      articleId: article.articleId,
    });
    if (!articleExists) {
      console.info(`Saving article ${article.articleId} to database`);
      await articlesDatabase.create(article);
      coutner++;
    }
  });
  console.info(
    `Saved ${coutner} articles to database, skipped ${
      articles.length - coutner
    } articles`
  );
};

const getNewsUnsentArticles = async () => {
  // get all articles that were not sent yet and set wasSent to true
  console.info("Trying to retrieve unsent articles from database");
  const articles = await articlesDatabase
    .find({ wasSent: false })
    .lean()
    .exec();
  console.info(`Found ${articles.length} unsent articles`);
  articles.forEach(async (article) => {
    // await articlesDatabase.updateOne({ _id: article._id }, { wasSent: true });
  });
  // sort the articles by date from oldest to newest
  articles.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  return articles;
};

const getYesterdayNews = async () => {
  const yesterday = moment().subtract(0, "days");
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
