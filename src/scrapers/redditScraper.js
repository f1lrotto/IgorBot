const axios = require('axios');
const cheerio = require('cheerio');

const scrapeSubredditOverview = async (subreddit) => {
  const { name, url, count: configStoryCount } = subreddit;
  console.info(`Scraping ${name} overview at ${url}`);

  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);
  
  let counter = 0;

  const stories = [];
  try {
    console.info(`Scraping ${name} overview`);
    $('#siteTable > div').each((i, el) => {
      if (counter > configStoryCount) return;
      
      // check if the element has a class of clearleft, if it does, skip this iteration
      const clearleft = $(el).hasClass('clearleft');
      if (clearleft) return;

      const info = $(el).find('.entry.unvoted > .top-matter');
      const title = info.find('p.title > a.title').text();

      if (title === '') return;

      const link = `https://old.reddit.com${info.find('p.title > a.title').attr('href')}`;
      const author = info.find('p.tagline > a.author').text();

      // make the storyId from the title (with spaces removed) and the author (with spaces removed)
      const storyId = `${title.replace(/ /g, '')}-${author.replace(/ /g, '')}`;

      stories.push({
        subreddit: name,
        title,
        author,
        url: link,
        storyId: storyId.replace(/[\\/:*?"<>|]/g, ''),
      });
      counter++;
    });
  } catch (error) {
    console.error(`Failed to scrape ${name} overview: ${error.message}`);
  }
  

  return stories;
};

const scrapeRedditStory = async (stories) => {
  console.info(`Scraping ${stories.length} stories`);

  // Use map to create an array of promises
  const updatedStories = await Promise.all(stories.map(async (story) => {
    const { url } = story;
    try {
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const storyContent = $('#siteTable > div > .entry.unvoted > .expando > form > .usertext-body > .md').text();
      story.storyContent = storyContent;

      // Uncomment below if you want to scrape comments in the future
      // const storyComments = [];
      // $('#siteTable > div > div > div.commentarea > div.sitetable.nestedlisting > div.comment').each((i, el) => {
      //   const comment = $(el).find('div.entry.unvoted > form.usertext > div.usertext-body.may-blank-within.md-container > div.md').text();
      //   storyComments.push(comment);
      // });
      // story.storyComments = storyComments;

      return story;
    } catch (error) {
      console.error(`Failed to scrape story from ${url}: ${error.message}`);
      return story; // If there's an error, return the story without any updates
    }
  }));

  return updatedStories;
};


module.exports = {
  scrapeSubredditOverview,
  scrapeRedditStory,
};
