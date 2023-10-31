const axios = require('axios');
const cheerio = require('cheerio');

const formulaDatabase = require('../models/formula.mongo');

async function formulaScrapeJob() {
  const response = await axios.get('https://www.formula1.com/en/latest/all.html#default');
  const $ = cheerio.load(response.data);

  const articles = [];
  $('.f1-latest-listing--grid-item').each((i, element) => {
    const url = $(element).find('a').attr('href');
    const title = $(element).find('.f1--s').text();
    const scrapeDate = new Date();
    const tag = $(element).find('.misc--tag').text();

    articles.push({ title, url, scrapeDate, tag });
  });

  return articles;
}

async function saveFormulaToDatabase(articles) {
  console.info('Attempting to save articles to database');
  let counter = 0;
  // save to database, but if already in mongo database, don't save
  articles.forEach(async (article) => {
    const articleExists = await formulaDatabase.exists({ url: article.url });
    if (!articleExists) {
      console.info(`Saving article ${article.url} to database`);
      await formulaDatabase.create(article);
      counter++;
    }
  });
  console.info(`Saved ${counter} articles to database, skipped ${articles.length - counter} articles`);
}

async function getUnsentFormula() {
  // get all articles that were not sent yet and set wasSent to true
  console.info('Trying to retrieve unsent articles from database');
  const articles = await formulaDatabase.find({ wasSent: false });
  console.info(`Found ${articles.length} unsent articles`);
  articles.forEach(async (article) => {
    await formulaDatabase.updateOne({ _id: article._id }, { wasSent: true });
  });
  // sort the articles by date from oldest to newest
  articles.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  return articles;
}


module.exports = {
  formulaScrapeJob,
  saveFormulaToDatabase,
  getUnsentFormula,
};  
