const { scrapeSubredditOverview, scrapeRedditStory, } = require('../scrapers/redditScraper');
const redditDatabase = require('../models/redditStories.mongo');

const config = require('../config/redditConfig');
const tiktokTTS = require('../services/tts');
const { subreddits, decentVoices } = config;

const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const getMP3Duration = require('get-mp3-duration');

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


function wrapText(text, maxWidth) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    if (currentLine.length + words[i].length + 1 <= maxWidth) {
      currentLine += ' ' + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  return lines;
}

function generateImageFromText(text, outputFilename) {
  const maxWidth = 25;
  const lines = wrapText(text, maxWidth);

  // Set initial parameters
  const padding = 5;
  const fontSize = 24;
  const lineHeight = fontSize * 1.2;  // Adjusted vertical spacing
  const fontWeight = 'bold';
  const font = `${fontWeight} ${fontSize}px sans-serif`;

  const tempCanvas = createCanvas(0, 0);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = font;
  const textWidth = Math.max(...lines.map(line => tempCtx.measureText(line).width));

  const transparentBorder = 40;
  const canvasWidth = textWidth + 2 * padding + 2 * transparentBorder;
  const canvasHeight = (lineHeight * lines.length) + 2 * padding + 2 * transparentBorder;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Ensure entire canvas is transparent
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Set font style
  ctx.fillStyle = '#f0f0f0';  // Mostly white with a touch of black
  ctx.strokeStyle = 'black';  // Black stroke for text
  ctx.lineWidth = 2;  // Adjust this value for thicker or thinner stroke
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Draw each line of text, adjusting for the transparent border
  lines.forEach((line, index) => {
    const yPos = transparentBorder + padding + index * lineHeight + fontSize;
    ctx.strokeText(line, canvasWidth / 2, yPos);
    ctx.fillText(line, canvasWidth / 2, yPos);
  });

  // Save the canvas to an image file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputFilename, buffer);
}



const makeTTS = async (stories) => {
  tiktokTTS.config('ad9bd62299664b32e18d8ee44a5e164f');
  stories = stories.slice(0, 1);
  const storiesAfterTTS = [];
  for (const story of stories) {
    const ttsStory = JSON.parse(JSON.stringify(story));
    const { storyContent, title, storyId } = ttsStory;

    const fileName = sanitizeFilename(storyId);

    // replace all the newlines with spaces and dots if there are not any before the newline
    const text = `${title}. ${storyContent}`.replace(/\.?\n+/g, '. ');

    const preprocessedText = preprocessText(text);

    const chunks = optimalSplit(preprocessedText);
    // get a random voice from the decent voices
    const voice = decentVoices[Math.floor(Math.random() * decentVoices.length)];
    const chunkDurations = await tiktokTTS.createAudioFromText(chunks, fileName, 'en_us_002');

    // generate the images for the chunks
    const subtitleImageFolderPath = path.join(__dirname, '..', 'assets', 'subtitles', fileName);
    if (!fs.existsSync(subtitleImageFolderPath)) {
      fs.mkdirSync(subtitleImageFolderPath, { recursive: true });
    }

    // const create a folder for the part headings
    const partHeadingFolderPath = path.join(__dirname, '..', 'assets', 'partHeadings', fileName);
    if (!fs.existsSync(partHeadingFolderPath)) {
      fs.mkdirSync(partHeadingFolderPath, { recursive: true });
      for (let i = 1; i < 10; i++) {
        const imagePath = path.join(partHeadingFolderPath, `part${i}.png`);
        generateImageFromText(`Part ${i}`, imagePath);
      }
    }


    // now fill out the chunk durations
    chunkDurations.map((chunk, i) => {
      const chunkBuffer = fs.readFileSync(chunk.path);
      const duration = getMP3Duration(chunkBuffer);
      chunk.duration = duration / 1000;

      const imagePath = path.join(subtitleImageFolderPath, `${i}.png`);
      generateImageFromText(chunk.text, imagePath);
      chunk.imagePath = imagePath;
    })

    ttsStory.ttsFileName = `${fileName}`;
    ttsStory.chunks = chunkDurations;
    storiesAfterTTS.push(ttsStory);
  }

  return storiesAfterTTS;
}
module.exports = {
  redditScrapeJob,
  saveRedditToDatabase,
  getRedditUnsentStories,
  makeTTS,
};
