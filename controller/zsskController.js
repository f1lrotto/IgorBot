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
  // Fetch the documents with wasSent: false and sort them by date
  const tweets = await ZsskDatabase.find({ wasSent: false }).sort({ date: 1 });

  // Update the wasSent flag of the fetched documents in the database
  await ZsskDatabase.updateMany(
    { _id: { $in: tweets.map((article) => article._id) } },
    { $set: { wasSent: true } }
  );

  return tweets;
};

module.exports = {
  zsskScrapeJob,
  saveToZsskDatabase,
  getZsskUnsentArticles,
}