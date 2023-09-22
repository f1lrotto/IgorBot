const scraper = require("../newsScraper/scraper");
const articlesDatabase = require("../models/articles.mongo");

const BASE_URL = "https://www.sme.sk/minuta/dolezite-spravy";

const newsScrapeJob = async () => {
  const articles = await scraper.scrapeOverview(BASE_URL);
  return articles;
}

const saveNewsToDatabase = async (articles) => {
  // save to database, but if already in mongo database, don't save
  articles.forEach(async (article) => {
    const articleExists = await articlesDatabase.exists({ articleId: article.articleId });
    if (!articleExists) {
      await articlesDatabase.create(article);
    }
  });
};

const getNewsUnsentArticles = async () => {
  // get all articles that were not sent yet and set wasSent to true
  const articles = await articlesDatabase.find({ wasSent: false });
  articles.forEach(async (article) => {
    await articlesDatabase.updateOne({ _id: article._id }, { wasSent: true });
  });
  // sort the articles by date from oldest to newest
  articles.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  return articles;
};

module.exports = {
  newsScrapeJob,
  saveNewsToDatabase,
  getNewsUnsentArticles,
};