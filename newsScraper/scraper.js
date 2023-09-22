const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment-timezone');

const scrapeOverview = async (url) => {
  const articles = [];
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  // scrape the main overview page
  $('.js-article-short-list-wrapper > div').each((i, el) => {
    const promo = $(el).children().eq(0).hasClass('artemis-promo-labels');
    if (promo) return;
    // if the id is undefined, skip this iteration
    const id = $(el).attr('data-article-id');
    if (!id) return;

    const mainDiv = $(el)
    const articleId = mainDiv.attr('data-article-id');

    // Extracting the date. If not present, we'll default to the current date in Bratislava's timezone.
    const dateElement = mainDiv.find('.article-short-side-content div a.fs-16');
    let articleDate = dateElement.length > 0 ? dateElement.text() : moment().tz("Europe/Bratislava").format("D. M. YYYY");

    const articleTime = mainDiv.find('.sans-bold.fs-16.article-short-time a').text();
    const category = mainDiv.find('.sans-reg.fs-12').text();

    const articleLink = mainDiv.find('.article-short-content p a');
    const fullParagraphText = mainDiv.find('.article-short-content p').text();
    
    const headlineElementA = mainDiv.find('.article-short-content p a strong');
    const headlineElementStrong = mainDiv.find('.article-short-content p strong:not(:has(a))'); // strong tag not containing anchor tag
    let headline;

    // Check if the <strong> tag is inside the <a> tag, wraps the <a> tag, or stands alone
    if (headlineElementA.length > 0) {
      headline = headlineElementA.text();
    } else if (headlineElementStrong.length > 0) {
      headline = headlineElementStrong.text();
    } else {
      headline = mainDiv.find('.article-short-content p strong a').text();
    }


    let articleContent = fullParagraphText.replace(headline, '').trim();
    if (articleContent.includes('Čítaj ďalej')) {
      articleContent = articleContent.split('Čítaj ďalej')[0].trim();
    }

    let articleUrl = articleLink.attr('href');

    // Check and adjust for 'javascript: void(0);'
    if (articleUrl === 'javascript: void(0);') {
      articleUrl = "undefined";
    }

    // get the 2nd div from the footer of the card, it holds article theme
    const articleShortFooter = mainDiv.find('footer');
    // get the text of an a tag, it holds the theme
    const theme = articleShortFooter.find('.btn.btn-s.btn-border.mb-xxs').text();

    const logData = {
      articleId,
      articleTime,
      articleDate,
      category,
      headline,
      articleContent,
      articleUrl,
      // push the theme only if it exists
      ...(theme && { theme }),
      // Check if the theme matches "Vojna na Ukrajine"
    };
    // push the article to the articles array
    articles.push(logData);
  });

  return articles;
};





module.exports = {
  scrapeOverview,
};
