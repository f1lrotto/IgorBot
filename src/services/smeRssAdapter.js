const smeScraper = require("../newsScraper/smeScraper");
const RssFeed = require("../models/RssFeed");
const RssItem = require("../models/RssItem");
const messageDistributor = require("./messageDistributor");

const SME_FEED_URL = "https://www.sme.sk/minuta/dolezite-spravy";
const SME_FEED_NAME = "SME.sk - Minúta po minúte";

class SmeRssAdapter {
  async initialize() {
    if (process.env.ENABLE_SME_SCRAPER !== "true") {
      console.info("SME Scraper is disabled via ENABLE_SME_SCRAPER environment variable");
      return;
    }

    console.info("Initializing SME Scraper as RSS feed source...");

    const existingFeed = await RssFeed.findOne({ feedUrl: SME_FEED_URL });
    
    if (!existingFeed) {
      console.info("Creating SME feed entry in database...");
      const feed = new RssFeed({
        guildId: "global",
        feedUrl: SME_FEED_URL,
        channelId: null,
        feedName: SME_FEED_NAME,
        feedIcon: "https://cdn.discordapp.com/attachments/1320838726603112568/1320851067847835719/331729766_1659510097825524_2275160154005558333_n.png",
        isActive: true,
        isBuiltIn: true,
        cardStyle: {
          color: "#d45959",
          showImage: true,
          maxDescriptionLength: 300,
          showTimestamp: true,
        },
      });
      
      await feed.save();
      console.info("SME feed entry created successfully");
    } else {
      console.info("SME feed entry already exists");
    }
  }

  async checkSmeFeed() {
    if (process.env.ENABLE_SME_SCRAPER !== "true") {
      return { success: true, skipped: true, message: "SME Scraper is disabled" };
    }

    try {
      console.info("Checking SME.sk for new articles...");
      
      const articles = await smeScraper.scrapeOverview(SME_FEED_URL);
      
      if (articles.length === 0) {
        return { success: true, newItemsCount: 0, message: "No new articles found" };
      }

      const feed = await RssFeed.findOne({ feedUrl: SME_FEED_URL });
      
      if (!feed) {
        throw new Error("SME feed not found in database");
      }

      const newItems = [];
      
      for (const article of articles) {
        const existingItem = await RssItem.findOne({
          feedId: feed._id,
          guid: article.articleId,
        });

        if (!existingItem) {
          const rssItem = new RssItem({
            feedId: feed._id,
            guid: article.articleId,
            title: article.headline,
            link: article.articleUrl,
            description: article.articleContent || article.fullContent || "",
            pubDate: new Date(article.articleTimestamp),
            imageUrl: article.img || null,
            categories: article.category ? [article.category] : [],
            wasSent: false,
          });

          await rssItem.save();
          newItems.push(rssItem);
        }
      }

      if (newItems.length > 0) {
        feed.lastItemGuid = newItems[0].guid;
      }
      feed.lastChecked = new Date();
      await feed.save();

      console.info(`Found ${newItems.length} new SME articles`);

      return {
        success: true,
        newItemsCount: newItems.length,
        message: `Found ${newItems.length} new articles from SME.sk`,
      };
    } catch (error) {
      console.error("Error checking SME feed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getSmeFeed() {
    return await RssFeed.findOne({ feedUrl: SME_FEED_URL });
  }

  async getNewSmeItems() {
    const feed = await this.getSmeFeed();
    if (!feed) return [];
    
    return await RssItem.find({
      feedId: feed._id,
      wasSent: false,
    }).sort({ pubDate: 1 });
  }

  async markItemsAsSent(itemIds) {
    await RssItem.updateMany(
      { _id: { $in: itemIds } },
      { wasSent: true }
    );
  }
}

module.exports = new SmeRssAdapter();
