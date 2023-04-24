const axios = require("axios");
const cheerio = require("cheerio");

const scrapeOverview = async (url) => {
  const articles = [];

  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  // scrape the rss feed
  $("mnt-Post-hash").each((i, el) => {
    const card = $(el).find("div");
    const article = card.find(".mnt-article");
    const title = article.find("a").text() || article.find("strong").text();
    // if the title is from strong tag, get the text from outside the tag
    
    articles.push({
      link: $(el).find("link").html(),
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
