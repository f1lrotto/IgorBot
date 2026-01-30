const RssFeed = require("../models/RssFeed");
const RssItem = require("../models/RssItem");
const rssParser = require("../services/rssParser");
const smeRssAdapter = require("../services/smeRssAdapter");

class RssController {
  async addFeed(guildId, feedUrl, channelId) {
    const validation = await rssParser.validateFeed(feedUrl);
    
    if (!validation.valid) {
      throw new Error(`Invalid RSS feed: ${validation.error}`);
    }

    const existingFeed = await RssFeed.findOne({ guildId, feedUrl });
    if (existingFeed) {
      throw new Error("This RSS feed is already subscribed in this server");
    }

    const feed = new RssFeed({
      guildId,
      feedUrl,
      channelId,
      feedName: validation.feedName,
      feedIcon: validation.feedIcon,
      isActive: true,
    });

    await feed.save();

    await this.checkFeed(feed._id);

    return {
      success: true,
      feedId: feed._id,
      feedName: feed.feedName,
      message: `Successfully added RSS feed "${feed.feedName}"`,
    };
  }

  async removeFeed(feedId) {
    const feed = await RssFeed.findById(feedId);
    
    if (!feed) {
      throw new Error("Feed not found");
    }

    await RssItem.deleteMany({ feedId });
    await RssFeed.findByIdAndDelete(feedId);

    return {
      success: true,
      message: `Successfully removed RSS feed "${feed.feedName}"`,
    };
  }

  async listFeeds(guildId) {
    const feeds = await RssFeed.find({ guildId }).sort({ createdAt: -1 });
    
    return feeds.map((feed) => ({
      id: feed._id,
      name: feed.feedName,
      url: feed.feedUrl,
      channelId: feed.channelId,
      isActive: feed.isActive,
      lastChecked: feed.lastChecked,
      itemCount: feed.isBuiltIn ? undefined : undefined,
    }));
  }

  async updateCardStyle(feedId, styleUpdates) {
    const feed = await RssFeed.findById(feedId);
    
    if (!feed) {
      throw new Error("Feed not found");
    }

    const allowedFields = ["color", "showImage", "maxDescriptionLength", "showTimestamp"];
    
    for (const [key, value] of Object.entries(styleUpdates)) {
      if (allowedFields.includes(key)) {
        feed.cardStyle[key] = value;
      }
    }

    await feed.save();

    return {
      success: true,
      message: `Updated card style for "${feed.feedName}"`,
      cardStyle: feed.cardStyle,
    };
  }

  async updateFeedName(feedId, newName) {
    const feed = await RssFeed.findById(feedId);
    
    if (!feed) {
      throw new Error("Feed not found");
    }

    feed.feedName = newName;
    await feed.save();

    return {
      success: true,
      message: `Updated feed name to "${newName}"`,
    };
  }

  async checkFeed(feedId) {
    const feed = await RssFeed.findById(feedId);
    
    if (!feed || !feed.isActive) {
      return { success: false, error: "Feed not found or inactive" };
    }

    const parseResult = await rssParser.parseFeed(feed.feedUrl);
    
    if (!parseResult.success) {
      return { success: false, error: parseResult.error };
    }

    const newItems = [];
    
    for (const item of parseResult.items) {
      const existingItem = await RssItem.findOne({
        feedId: feed._id,
        guid: item.guid,
      });

      if (!existingItem) {
        const rssItem = new RssItem({
          feedId: feed._id,
          guid: item.guid,
          title: item.title,
          link: item.link,
          description: item.description,
          pubDate: new Date(item.pubDate),
          imageUrl: item.imageUrl,
          categories: item.categories,
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

    if (newItems.length > 0) {
      newItems.sort((a, b) => a.pubDate - b.pubDate);
      const messageDistributor = require("../services/messageDistributor");
      await messageDistributor.sendRssItems(feed, newItems);
    }

    return {
      success: true,
      newItemsCount: newItems.length,
      message: `Found ${newItems.length} new items`,
    };
  }

  async checkAllFeeds() {
    const results = [];

    const smeResult = await smeRssAdapter.checkSmeFeed();
    results.push({
      feedId: "sme",
      feedName: "SME.sk",
      ...smeResult,
    });

    if (smeResult.success && smeResult.newItemsCount > 0) {
      await this.distributeSmeItems();
    }

    const feeds = await RssFeed.find({ isActive: true, isBuiltIn: false });

    for (const feed of feeds) {
      try {
        const result = await this.checkFeed(feed._id);
        results.push({
          feedId: feed._id,
          feedName: feed.feedName,
          ...result,
        });
      } catch (error) {
        results.push({
          feedId: feed._id,
          feedName: feed.feedName,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async distributeSmeItems() {
    try {
      const feed = await smeRssAdapter.getSmeFeed();
      if (!feed) return;

      const newItems = await smeRssAdapter.getNewSmeItems();
      if (newItems.length === 0) return;

      const targetFeeds = await RssFeed.find({
        isBuiltIn: false,
        isActive: true,
      });

      const messageDistributor = require("../services/messageDistributor");
      for (const targetFeed of targetFeeds) {
        await messageDistributor.sendRssItems(targetFeed, newItems);
      }

      await smeRssAdapter.markItemsAsSent(newItems.map((item) => item._id));
    } catch (error) {
      console.error("Error distributing SME items:", error);
    }
  }

  async toggleFeed(feedId, isActive) {
    const feed = await RssFeed.findById(feedId);
    
    if (!feed) {
      throw new Error("Feed not found");
    }

    feed.isActive = isActive;
    await feed.save();

    return {
      success: true,
      message: `Feed "${feed.feedName}" is now ${isActive ? "active" : "inactive"}`,
    };
  }
}

module.exports = new RssController();
