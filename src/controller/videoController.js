const fs = require('fs');
const path = require('path');

let editly;

async function loadEditly() {
  editly = await import('editly');
}

const createTikTokConfig = (story, backgroundVideoPath, endVideoPath) => {
  let audioStartTime = 0;
  const audioTracks = story.chunks.map(chunk => {
    const track = {
      path: chunk.path,
      mixVolume: 1,
      cutFrom: 0,
      start: audioStartTime,
    };
    audioStartTime += chunk.duration;
    return track;
  });

  let videoStartTime = 0;
  const clips = story.chunks.map(chunk => {
    const clip = {
      transition: null,
      layers: [
        {
          type: 'video',
          path: backgroundVideoPath,
          cutFrom: videoStartTime,
          cutTo: videoStartTime + chunk.duration,
        },
        {
          type: 'image-overlay',
          path: chunk.imagePath,
          position: 'center',
        },
      ],
    };
    videoStartTime += chunk.duration;
    return clip;
  });

  return {
    outPath: endVideoPath,
    width: 480,
    height: 854,
    fps: 25,
    allowRemoteRequests: false,
    defaults: { transition: null },
    clips,
    loopAudio: false,
    keepSourceAudio: false,
    clipsAudioVolume: 1,
    outputVolume: 10,
    audioTracks,
    audioNorm: {
      enable: false,
      gaussSize: 5,
      maxGain: 30,
    },
  };
};

produceTiktokVideo = async (tiktokConfig) => {
  await editly.default(tiktokConfig);
  return 0;
};

const createYTShortsConfig = (story, backgroundVideoPath, partHeaderPath) => {
  let currentStartTime = 0;
  let partNumber = 1;
  const ytShortsConfigs = [];

  while (currentStartTime < story.chunks.reduce((sum, chunk) => sum + chunk.duration, 0)) {
    let accumulatedDuration = 0;
    let currentChunks = [];

    // Gathering chunks until 60 seconds is reached
    while (accumulatedDuration < 60 && story.chunks.length > 0) {
      const chunk = story.chunks.shift(); // remove the first chunk
      if (accumulatedDuration + chunk.duration <= 60) {
        currentChunks.push(chunk);
        accumulatedDuration += chunk.duration;
      } else {
        break;
      }
    }

    // Set video start time to 0 for each YT Shorts part
    let videoStartTime = 0;

    const clips = currentChunks.map(chunk => {
      const clip = {
        transition: null,
        layers: [
          {
            type: 'video',
            path: backgroundVideoPath,
            cutFrom: videoStartTime,
            cutTo: videoStartTime + chunk.duration,
          },
          {
            type: 'image-overlay',
            path: path.join(partHeaderPath, `part${partNumber}.png`),
            position: 'top',
          },
          {
            type: 'image-overlay',
            path: chunk.imagePath,
            position: 'center',
          }
        ],
      };
      videoStartTime += chunk.duration;
      return clip;
    });

    const ytShortsEndVideoPath = path.join(__dirname, '..', '/readyVideos', `/${story.ttsFileName}`, '/ytShorts', `ytShortVideoPart${partNumber}.mp4`);

    const config = {
      outPath: ytShortsEndVideoPath,
      width: 480,
      height: 854,
      fps: 25,
      allowRemoteRequests: false,
      defaults: { transition: null },
      clips,
      loopAudio: false,
      keepSourceAudio: false,
      clipsAudioVolume: 1,
      outputVolume: 10,
      audioTracks: currentChunks.map(chunk => ({ path: chunk.path, mixVolume: 1, cutFrom: 0, start: currentStartTime })),
      audioNorm: {
        enable: false,
        gaussSize: 5,
        maxGain: 30,
      },
    };

    ytShortsConfigs.push(config);
    partNumber++;
  }

  return ytShortsConfigs;
};

const produceYTShortsVideo = async (ytShortsConfigs) => {
  for (const ytShortsConfig of ytShortsConfigs) {
    await editly.default(ytShortsConfig);
  }
  return 0;
};


const produceVideo = async (stories) => {
  await loadEditly();

  console.info('\nStarting to produce videos');

  for (const story of stories) {
    // get the folder name from the storyId
    const ttsPath = path.join(__dirname, '..', 'assets', '/TTS', `${story.ttsFileName}`);
    console.info(`\nTTS path: ${ttsPath}`);

    const backgroundVideoPath = path.join(__dirname, '..', 'assets', '/backgroundVideos', `1.mp4`);
    
    const tiktokFolderPath = path.join(__dirname, '..', 'readyVideos', story.ttsFileName, 'tiktok');
    const ytShortsFolderPath = path.join(__dirname, '..', 'readyVideos', story.ttsFileName, 'ytShorts');

    if (!fs.existsSync(tiktokFolderPath)) {
      fs.mkdirSync(tiktokFolderPath, { recursive: true });
    }

    if (!fs.existsSync(ytShortsFolderPath)) {
      fs.mkdirSync(ytShortsFolderPath, { recursive: true });
    }

    const tiktokEndVideoPath = path.join(tiktokFolderPath, 'tiktokVideo.mp4');
    const ytShortsEndVideoPath = path.join(ytShortsFolderPath, 'ytShortVideo.mp4');


    const partHeaderPath = path.join(__dirname, '..', 'assets', '/partHeadings');

    // now we need to create 2 configs, one for tiktok and one for ytShorts
    const tiktokConfig = createTikTokConfig(story, backgroundVideoPath, tiktokEndVideoPath);
    const ytShortsConfig = createYTShortsConfig(story, backgroundVideoPath, ytShortsEndVideoPath, partHeaderPath);

    const tiktokResult = await produceTiktokVideo(tiktokConfig);
    const ytShortsResult = await produceYTShortsVideo(ytShortsConfig);
    
    const editSpec = {
      outPath: endVideoPath,
      width: 480,
      height: 854,
      fps: 25,
      allowRemoteRequests: false,
      defaults: { transition: null },
      clips,
      // audioFilePath: ttsPath,
      loopAudio: false,
      keepSourceAudio: false,
      clipsAudioVolume: 1,
      outputVolume: 10,
      audioTracks,
      audioNorm: {
        enable: false,
        gaussSize: 5,
        maxGain: 30,
      },
    };
    await editly.default(editSpec);
  }
  return 0;
};

module.exports = {
  produceVideo,
};