const moment = require("moment");

function makeDennikDiscordMessage(newArticles) {
  const newArticleArray = []
  let message = `**There are ${newArticles.length} new articles on Minuta po Minute.**\n\n`

  if (newArticles.length == 1) {
    message = `**There is ${newArticles.length} new article on Minuta po Minute.**\n\n`;
  }
  newArticleArray.push(message)

  newArticles.forEach((article) => {
    const time = moment(article.time).add(2, 'hours').format("Do MMM HH:mm");
    message = `At ${time}, **${article.headline}**\n${article.text}\n<${article.postLink}>\n\n`;
    newArticleArray.push([message])
  });
  return newArticleArray;
}

function makeZsskDiscordMessage(newTweets) {
  const newTweetsArray = []

  newTweets.forEach((tweet) => {
    const time = moment(tweet.date).add(2, 'hours').format("Do MMM HH:mm");
    const isKill = tweet.tweet.includes("zrazil");
    const tweetText = isKill ? `**${tweet.tweet}**` : tweet.tweet;
    message = `At ${time}\n${tweetText}\n${tweet.link}`;
    newTweetsArray.push([message])
  });
  return newTweetsArray;
}

module.exports = {makeDennikDiscordMessage, makeZsskDiscordMessage};
