const Parser = require("rss-parser");

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"],
    ],
  },
});

class RssParserService {
  async validateFeed(feedUrl) {
    try {
      const feed = await parser.parseURL(feedUrl);
      return {
        valid: true,
        feedName: feed.title || "Unknown Feed",
        feedIcon: feed.image?.url || null,
        itemCount: feed.items?.length || 0,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  async parseFeed(feedUrl) {
    try {
      const feed = await parser.parseURL(feedUrl);
      
      const items = feed.items.map((item) => {
        const imageUrl = this.extractImageUrl(item);
        
        return {
          guid: item.guid || item.id || item.link,
          title: item.title || "No title",
          link: item.link || "",
          description: item.contentSnippet || item.content || "",
          pubDate: item.pubDate || item.isoDate || new Date(),
          imageUrl,
          categories: item.categories || [],
        };
      });

      return {
        success: true,
        feedName: feed.title || "Unknown Feed",
        feedIcon: feed.image?.url || null,
        items,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  extractImageUrl(item) {
    if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
      return item.mediaContent.$.url;
    }
    
    if (item.enclosure && item.enclosure.url) {
      return item.enclosure.url;
    }
    
    if (item["media:content"] && item["media:content"].$ && item["media:content"].$.url) {
      return item["media:content"].$.url;
    }
    
    const content = item.content || item["content:encoded"] || "";
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch) {
      return imgMatch[1];
    }
    
    return null;
  }
}

module.exports = new RssParserService();
