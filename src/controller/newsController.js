const scraper = require("../newsScraper/scraper");
const articlesDatabase = require("../models/articles.mongo");

const BASE_URL = "https://www.sme.sk/minuta/dolezite-spravy";

const newsScrapeJob = async () => {
  console.info('Starting the news scraper');
  const articles = await scraper.scrapeOverview(BASE_URL);
  console.info(`Scraped ${articles.length} articles`);
  return articles;
}

const saveNewsToDatabase = async (articles) => {
  console.info("Attempting to save articles to database");
  let coutner = 0;
  // save to database, but if already in mongo database, don't save
  articles.forEach(async (article) => {
    const articleExists = await articlesDatabase.exists({ articleId: article.articleId });
    if (!articleExists) {
      console.info(`Saving article ${article.articleId} to database`);
      await articlesDatabase.create(article);
      coutner++;
    }
  });
  console.info(`Saved ${coutner} articles to database, skipped ${articles.length - coutner} articles`);
};

const getNewsUnsentArticles = async () => {
  // get all articles that were not sent yet and set wasSent to true
  console.info("Trying to retrieve unsent articles from database");
  const articles = await articlesDatabase.find({ wasSent: false });
  console.info(`Found ${articles.length} unsent articles`);
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