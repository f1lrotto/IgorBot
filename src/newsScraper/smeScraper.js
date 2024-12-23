const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment-timezone");

// Configuration object for selectors and constants
const CONFIG = {
  selectors: {
    articleWrapper: ".js-article-short-list-wrapper > div",
    dateElement: ".article-short-side-content div a.fs-16",
    timeElement: ".sans-bold.fs-16.article-short-time a",
    categoryElement: ".sans-reg.fs-12",
    contentWrapper: ".article-short-content p",
    contentLink: ".article-short-content p a",
    headlineInLink: ".article-short-content p strong a",
    headlineStandalone: ".article-short-content p strong:not(:has(a))",
    themeElements: ".btn.btn-s.btn-border.mb-xxs",
    articleContent: ".js-remp-article-data.cf.js-font-resize.js-article-stats-item",
    excludeElements: [
      ".share-box",
      ".js-ab-test-topic-after-forum",
      ".artemis-ad-position",
      ".article-item-wrapper",
      ".editorial-promo",
      ".js-deep-container-promo-piano-article",
      "#js-promobox-data",
      "#sme-promobox-teaser"
    ],
  },
  defaults: {
    timezone: "Europe/Bratislava",
    dateFormat: "D. M. YYYY",
    dateTimeFormat: "D. M. YYYY HH:mm",
    defaultUrl: "https://www.sme.sk/minuta/dolezite-spravy",
    source: "SME",
  },
};

// Helper function to safely extract text content
const safeExtract = (element, defaultValue = "") => {
  return element && element.length > 0 ? element.text().trim() : defaultValue;
};

// Fetch and parse article content
const fetchArticleContent = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const $ = cheerio.load(response.data);
    const articleElement = $(CONFIG.selectors.articleContent);

    // Create a clone of the article element to manipulate
    const articleClone = articleElement.clone();

    // Remove excluded elements from the clone
    CONFIG.selectors.excludeElements.forEach(selector => {
      articleClone.find(selector).remove();
      // Also remove elements by ID if the selector is an ID
      if (selector.startsWith('#')) {
        articleClone.find(`[id="${selector.slice(1)}"]`).remove();
      }
    });

    // Extract and clean the text
    let content = articleClone.text().trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .replace(/\s+\n/g, '\n') // Remove spaces before newlines
      .replace(/\n\s+/g, '\n'); // Remove spaces after newlines

    // Additional cleanup
    content = content
      .split('\n')
      .filter(line => line.trim()) // Remove empty lines
      .join('\n');

    return content || null;
  } catch (error) {
    console.error(`Error fetching article content from ${url}: ${error.message}`);
    return null;
  }
};

// Parse single article data
const parseArticle = async ($, element) => {
  try {
    const mainDiv = $(element);
    
    // Skip promo articles
    if (mainDiv.children().eq(0).hasClass("artemis-promo-labels")) {
      return null;
    }

    const articleId = mainDiv.attr("data-article-id");
    if (!articleId) {
      return null;
    }

    const img = mainDiv.find("img").attr("src");
    
    // Date and time processing
    const dateElement = mainDiv.find(CONFIG.selectors.dateElement);
    const articleDate = safeExtract(
      dateElement,
      moment().tz(CONFIG.defaults.timezone).format(CONFIG.defaults.dateFormat)
    );
    
    const articleTime = safeExtract(mainDiv.find(CONFIG.selectors.timeElement));
    const articleTimestamp = moment(
      `${articleDate} ${articleTime}`,
      CONFIG.defaults.dateTimeFormat
    ).toISOString();

    // Content processing
    const category = safeExtract(mainDiv.find(CONFIG.selectors.categoryElement));
    
    // Improved headline extraction
    const paragraphElement = mainDiv.find(CONFIG.selectors.contentWrapper);
    const strongElement = paragraphElement.find('strong').first();
    const headlineLink = strongElement.find('a').first();
    
    let headline = '';
    let articleContent = '';
    
    // Get the full paragraph text first
    const fullParagraphText = safeExtract(paragraphElement);
    
    if (headlineLink.length > 0) {
      // If there's a link in the strong tag, that's our headline
      headline = safeExtract(headlineLink);
      // Remove the headline from the content
      articleContent = fullParagraphText.replace(headline, '').trim();
    } else if (strongElement.length > 0) {
      // If there's just a strong tag, that's our headline
      headline = safeExtract(strongElement);
      articleContent = fullParagraphText.replace(headline, '').trim();
    }
    
    // Clean up the content
    articleContent = articleContent.replace(/^\s*[.,]\s*/, ''); // Remove leading punctuation
    if (articleContent.includes("Čítaj ďalej")) {
      articleContent = articleContent.split("Čítaj ďalej")[0].trim();
    }

    // URL processing with validation
    const articleLink = headlineLink.length > 0 ? headlineLink : mainDiv.find(CONFIG.selectors.contentLink);
    let articleUrl = articleLink.attr("href");
    if (!articleUrl || articleUrl === "javascript: void(0);") {
      articleUrl = CONFIG.defaults.defaultUrl;
    }

    // Theme processing
    const theme = [];
    mainDiv.find(CONFIG.selectors.themeElements).each((i, el) => {
      const themeText = $(el).text().trim();
      if (themeText) theme.push(themeText);
    });

    // Fetch full article content if URL is available
    let fullContent = null;
    if (articleUrl && articleUrl !== CONFIG.defaults.defaultUrl) {
      fullContent = await fetchArticleContent(articleUrl);
    }

    return {
      articleId,
      articleTime,
      articleDate,
      articleTimestamp,
      category,
      headline,
      articleContent,
      articleUrl,
      source: CONFIG.defaults.source,
      ...(theme.length > 0 && { theme }),
      ...(img && { img }),
      ...(fullContent && { fullContent }),
    };
  } catch (error) {
    console.error(`Error parsing article: ${error.message}`);
    return null;
  }
};

const scrapeOverview = async (url) => {
  console.info(`Starting scrape of ${url}`);
  
  try {
    const response = await axios.get(url, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    const $ = cheerio.load(response.data);
    const articles = [];

    // Process articles sequentially to avoid overwhelming the server
    for (const element of $(CONFIG.selectors.articleWrapper).toArray()) {
      const article = await parseArticle($, element);
      if (article) {
        console.info(`Scraped article ${article.articleId}-${article.headline}`);
        articles.push(article);
      }
    }

    return articles;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Network error while scraping: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
      }
    } else {
      console.error(`Error scraping overview page: ${error.message}`);
    }
    return [];
  }
};

module.exports = {
  scrapeOverview,
};
