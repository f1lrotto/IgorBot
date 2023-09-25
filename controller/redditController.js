const { scrapeSubredditOverview, scrapeRedditStory, } = require('../scrapers/redditScraper');
const redditDatabase = require('../models/redditStories.mongo');

const config = require('../config/redditConfig');
const tiktokTTS = require('../services/tts');
const { subreddits, decentVoices } = config;

const path = require('path');

const redditScrapeJob = async () => {
  console.info('Starting the Reddit scraper');
  

  console.info(`Starting to scrape ${subreddits.length} subreddits`);
  const subredditOveriews = await Promise.all(subreddits.map(async (subreddit) => {
    return await scrapeSubredditOverview(subreddit);
  }));
  console.info(`Finished scraping ${subredditOveriews.length} subreddits`);
  
  console.info(`Starting to scrape the stories from the overviews`);
  const stories = await Promise.all(subredditOveriews.map(async (overview) => {
    return await scrapeRedditStory(overview);
  }));

  return stories;
}

const saveRedditToDatabase = async (stories) => {
  console.info("Attempting to save stories to database");

  stories.forEach(subreddit => {
    let counter = 0;
    // save to database, but if already in mongo database, don't save
    subreddit.forEach(async (story) => {
      const storyExists = await redditDatabase.exists({ storyId: story.storyId });
      if (!storyExists) {
        console.info(`Saving story ${story.storyId} to database`);
        await redditDatabase.create(story);
        counter++;
      }
    });
    console.info(`Saved ${counter} stories to database, skipped ${stories.length - counter} stories`);
  });
};

const getRedditUnsentStories = async () => {
  const stories = await redditDatabase.find({ wasSentTiktok: false });
  return stories;
}

const sanitizeFilename = (filename) => {
  return filename.replace(/[\\/:*?"<>|]/g, '');
}

const optimalSplit = (text, maxCharCount = 149) => {
  const sentences = text.match(/[^.!?]+[.!?]/g) || [];
  let chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (sentence.length > maxCharCount) {
      // If a single sentence is too long, split it into words
      const words = sentence.split(' ');
      for (const word of words) {
        if ((currentChunk + word).length <= maxCharCount) {
          currentChunk += word + " ";
        } else {
          if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
          }
          currentChunk = word + " ";
        }
      }
    } else {
      if ((currentChunk + sentence).length <= maxCharCount) {
        currentChunk += sentence + " ";
      } else {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence + " ";
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Filter out chunks that are just punctuation
  chunks = chunks.filter(chunk => !/^[.!?]+$/.test(chunk));

  return chunks;
}

const preprocessText = (text) => {
  // common abbreviations
  // text = text.replace();
  text = text.replace('AITAH', 'Am I the a hole');
  text = text.replace('AITA', 'Am I the a hole');

  return text;
}

const adjustDurationsToTotal = (chunks, desiredTotal) => {
  // Calculate the current total duration of chunks
  const currentTotalDuration = chunks.reduce((acc, chunk) => acc + parseFloat(chunk.duration), 0);

  // Adjust each chunk's duration based on its proportion of the desired total duration
  return chunks.map(chunk => ({
    ...chunk,
    duration: (parseFloat(chunk.duration) / currentTotalDuration * desiredTotal).toFixed(3) // .toFixed(3) ensures we have 3 decimal points
  }));
};

const makeTTS = async (stories) => {
  tiktokTTS.config('ad9bd62299664b32e18d8ee44a5e164f');
  stories = stories.slice(1, 2);
  for (const story of stories) {
    const { storyContent, title, storyId } = story;
    const fileName = sanitizeFilename(storyId);
    console.info(`Making TTS for story ${storyId}`);

    // replace all the newlines with spaces and dots if there are not any before the newline
    const text = `${title}. ${storyContent}`.replace(/\.?\n+/g, '. ');

    const preprocessedText = preprocessText(text);

    const chunks = optimalSplit(preprocessedText);
    // get a random voice from the decent voices
    const voice = decentVoices[Math.floor(Math.random() * decentVoices.length)];
    const ttsPath = path.join(__dirname, '..', '/TTS', `${fileName}`);
    const chunkDurations = await tiktokTTS.createAudioFromText(chunks, ttsPath, 'en_us_006');
    // chunk durations are {text, duration in s}
    // if a chunk is under a second, merge it with the next chunk
    const adjustedChunks = adjustDurationsToTotal(chunkDurations, 1);
    

    story.ttsFileName = `${fileName}`;
    story.mergedChunks = chunkDurations;
  }

  return stories;
}
module.exports = {
  redditScrapeJob,
  saveRedditToDatabase,
  getRedditUnsentStories,
  makeTTS,
};
