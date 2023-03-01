const axios = require("axios");
const cheerio = require("cheerio");

const scrapeOverview = async (url) => {
  const articles = [];

  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  // scrape the rss feed
  $("item").each((i, el) => {
    articles.push({
      link: $(el).find("link").text(),
      pubDate: new Date($(el).find("pubDate").text()).toISOString(),
    });
  });

  return articles;
};

const scrapeArticle = async (feedItem) => { 
  const response = await axios.get(feedItem.link);
  const html = response.data;
  const $ = cheerio.load(html);

  // scrape the article
  const article = $("article");
  const title = article.find("a").text();
  const text = article.find("p").text();

  return {
    title,
    text,
    date: feedItem.pubDate,
    link: feedItem.link,
    wasSent: false,
  }
};


module.exports = {
  scrapeOverview,
  scrapeArticle,
};
