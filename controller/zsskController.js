//TODO MILAN
const { getPageDataWithPuppeteer } = require('../zsskScraper/scraper');
const ZsskDatabase = require("../models/zssk.mongo");

const zsskScrapeJob = async () => {
  const url = "https://twitter.com/zssk_mimoriadne";
  const data = getPageDataWithPuppeteer(url);
  return data;
};

const saveToZsskDatabase = async (zsskTweets) => {
  zsskTweets.forEach(async (tweet) => {
    const tweetExists = await ZsskDatabase.exists({ link: tweet.href});
    if (!tweetExists) {
      const zsskInstance = new ZsskDatabase({
        link: tweet.href,
        date: tweet.timestamp,
        tweet: tweet.tweet,
        wasSent: false
      });
      zsskInstance.save(function (err) {
        if (err) return console.error(err);
      });
    }
  });
};

const getZsskUnsentArticles = async () => {
  const tweets = await ZsskDatabase.find({ wasSent: false });
  tweets.forEach(async (tweet) => {
    await ZsskDatabase.updateOne({ _id: tweet._id }, { wasSent: true });
  });
  
  tweets.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  return tweets;
};

module.exports = {
  zsskScrapeJob,
  saveToZsskDatabase,
  getZsskUnsentArticles,
}