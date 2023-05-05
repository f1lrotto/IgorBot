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
  // Fetch the documents with wasSent: false and sort them by date
  const articles = await articlesDatabase.find({ wasSent: false }).sort({ date: 1 });

  // Update the wasSent flag of the fetched documents in the database
  await articlesDatabase.updateMany(
    { _id: { $in: articles.map((article) => article._id) } },
    { $set: { wasSent: true } }
  );

  return articles;
};



module.exports = {
  dennikScrapeJob,
  saveDennikToDatabase,
  getDennikUnsentArticles,
};