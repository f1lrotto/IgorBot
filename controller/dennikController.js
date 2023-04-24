const scraper = require("../dennikScraper/scraper");
const articlesDatabase = require("../models/articles.mongo");

const BASE_URL_DN = "https://dennikn.sk/minuta/dolezite";

const dennikScrapeJob = async () => {
  const articles = [];

  const scrapedOverview = await scraper.scrapeOverview(BASE_URL_DN);

  for (let i = 0; i < scrapedOverview.length; i++) {
    const article = await scraper.scrapeArticle(scrapedOverview[i]);
    articles.push(article);
  }
  return articles;
};

const saveDennikToDatabase = async (articles) => {
  // save to database, but if already in mongo database, don't save
  articles.forEach(async (article) => {
    const articleExists = await articlesDatabase.exists({ link: article.link });
    if (!articleExists) {
      await articlesDatabase.create(article);
    }
  });
};

const getDennikUnsentArticles = async () => {
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
  dennikScrapeJob,
  saveDennikToDatabase,
  getDennikUnsentArticles,
};