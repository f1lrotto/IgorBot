const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment-timezone");

// Configuration object for selectors and constants
const CONFIG = {
  selectors: {
    articleWrapper: ".listing__item",
    timeElement: ".meta__time",
    categoryElement: ".meta__title",
    importantTag: ".tag--minute-important",
    contentWrapper: ".listing__item-content",
    contentParagraph: ".listing__item-content > p",
    contentLink: "a.link--underline",
    imageElement: ".listing__item-content img",
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
    timeFormat: "HH:mm",
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

    // Get article ID from data attribute
    const articleId = mainDiv.attr("data-js-minute-post-id");
    if (!articleId) {
      console.warn('Article element has no data-js-minute-post-id attribute, skipping');
      return null;
    }
    console.info(`Parsing article with ID: ${articleId}`);

    // Get time and create timestamp (use today's date since only time is provided)
    const articleTime = safeExtract(mainDiv.find(CONFIG.selectors.timeElement));
    if (!articleTime) {
      console.warn(`Article ${articleId} has no time, skipping`);
      return null;
    }

    const articleDate = moment().tz(CONFIG.defaults.timezone).format(CONFIG.defaults.dateFormat);
    const articleTimestamp = moment(
      `${articleDate} ${articleTime}`,
      CONFIG.defaults.dateTimeFormat
    ).toISOString();

    // Get category
    const category = safeExtract(mainDiv.find(CONFIG.selectors.categoryElement));

    // Check if it's marked as important
    const isImportant = mainDiv.find(CONFIG.selectors.importantTag).length > 0;

    // Get content and link
    const contentWrapper = mainDiv.find(CONFIG.selectors.contentWrapper);
    const paragraphElement = contentWrapper.find('p').first();
    const link = paragraphElement.find(CONFIG.selectors.contentLink).first();

    // Extract headline from link text
    const headline = safeExtract(link);
    if (!headline) {
      console.warn(`Article ${articleId} has no headline, skipping`);
      return null;
    }

    // Get article URL
    let articleUrl = link.attr("href");
    if (!articleUrl || articleUrl === "javascript: void(0);") {
      console.warn(`Article ${articleId} has no valid URL`);
      articleUrl = CONFIG.defaults.defaultUrl;
    }

    // Get full paragraph text as content (remove the link text to get description)
    const fullParagraphText = safeExtract(paragraphElement);
    let articleContent = fullParagraphText.replace(headline, '').trim();
    articleContent = articleContent.replace(/^[,\s]+/, ''); // Remove leading commas/spaces

    // Get image if present - try multiple selectors
    let img = null;
    const imageElement = contentWrapper.find('img').first();
    if (imageElement.length > 0) {
      // Try src first, then data-src for lazy-loaded images
      img = imageElement.attr('src') || imageElement.attr('data-src');
      console.info(`Found image for article ${articleId}: ${img ? img.substring(0, 60) + '...' : 'none'}`);
    } else {
      console.info(`No image found for article ${articleId}`);
    }

    // Fetch full article content if URL is available
    let fullContent = null;
    if (articleUrl && articleUrl !== CONFIG.defaults.defaultUrl) {
      console.info(`Fetching full content for article ${articleId}`);
      fullContent = await fetchArticleContent(articleUrl);
    }

    const article = {
      articleId,
      articleTime,
      articleDate,
      articleTimestamp,
      category,
      headline,
      articleContent,
      articleUrl,
      source: CONFIG.defaults.source,
      ...(img && { img }),
      ...(fullContent && { fullContent }),
    };

    // Add important tag as theme if present
    if (isImportant) {
      article.theme = ["Dôležité"];
    }

    return article;
  } catch (error) {
    console.error(`Error parsing article: ${error.message}`);
    console.error(`Stack trace:`, error.stack);
    return null;
  }
};

const scrapeOverview = async (url) => {
  console.info(`Starting scrape of ${url}`);

  try {
    console.info('Fetching page with axios...');
    const response = await axios.get(url, {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
    });
    console.info(`Page fetched successfully. Status: ${response.status}, Content length: ${response.data.length}`);

    const $ = cheerio.load(response.data);
    const articleElements = $(CONFIG.selectors.articleWrapper);
    console.info(`Found ${articleElements.length} article elements with selector: "${CONFIG.selectors.articleWrapper}"`);

    if (articleElements.length === 0) {
      console.warn('No articles found. The page structure might have changed.');
      console.info('Trying to log first 1000 chars of page HTML:');
      console.info(response.data.substring(0, 1000));
    }

    const articles = [];

    // Process articles sequentially to avoid overwhelming the server
    for (const element of articleElements.toArray()) {
      const article = await parseArticle($, element);
      if (article) {
        console.info(`✓ Scraped article ${article.articleId}: ${article.headline.substring(0, 50)}...`);
        articles.push(article);
      } else {
        console.info('✗ Article was skipped (null result from parseArticle)');
      }
    }

    console.info(`Successfully scraped ${articles.length} articles`);
    return articles;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Network error while scraping: ${error.message}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
      }
    } else {
      console.error(`Error scraping overview page: ${error.message}`);
      console.error(`Stack trace:`, error.stack);
    }
    return [];
  }
};

module.exports = {
  scrapeOverview,
};
