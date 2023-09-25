let editly;

async function loadEditly() {
  editly = await import('editly');
}

const getMP3Duration = require('get-mp3-duration');
const path = require('path');
const fs = require('fs');
const adjustDurations = (chunks, totalDuration) => {
  // Calculate the current total duration of chunks
  const currentTotalDuration = chunks.reduce((acc, chunk) => acc + chunk.duration, 0);
  console.log(`Current total duration: ${currentTotalDuration}`);

  // Calculate the additional duration required per chunk
  const additionalDurationPerChunk = (totalDuration - currentTotalDuration) / chunks.length;
  console.log(`Additional duration per chunk: ${additionalDurationPerChunk}`);

  // Adjust each chunk's duration
  return chunks.map(chunk => ({
    ...chunk,
    duration: chunk.duration + additionalDurationPerChunk,
  }));
};

const adjustDurationsToTotal = (chunks, desiredTotal) => {
  // Calculate the current total duration of chunks
  const currentTotalDuration = chunks.reduce((acc, chunk) => acc + parseFloat(chunk.duration), 0);

  // Adjust each chunk's duration based on its proportion of the desired total duration
  return chunks.map(chunk => ({
    ...chunk,
    duration: (parseFloat(chunk.duration) / currentTotalDuration * desiredTotal).toFixed(3) // .toFixed(3) ensures we have 3 decimal points
  }));
};

const createSubtitles = (mergedChunks, duration) => {

  const adjustedChunks = adjustDurationsToTotal(mergedChunks, duration);
  console.log(`Adjusted chunks: ${JSON.stringify(adjustedChunks, null, 2)}`);
  let layers = [];
  let start = 0;
  console.log(`Creating subtitles for ${adjustedChunks.length} chunks`);
  console.log(`Merged chunks: ${JSON.stringify(adjustedChunks, null, 2)}`);

  for (let i = 0; i < adjustedChunks.length; i += 1) {
    const { text, duration: chunkDuration } = adjustedChunks[i];
    let stop = Number(start) + Number(chunkDuration);

    layers.push({
      text,
      type: 'subtitle',
      start,
      stop,
      left: 0.05,
      top: 0.9,
      originX: 'left',
      originY: 'bottom',
    });

    start = stop;
  }

  return layers;
};


const produceVideo = async (stories) => {
  await loadEditly();
  console.info('Starting to produce videos');
  for (const story of stories) {
    const ttsPath = path.join(__dirname, '..', '/TTS', `${story.ttsFileName}.mp3`);
    console.info(`TTS path: ${ttsPath}`);
    const videoPath = path.join(__dirname, '..', '/videos', `fruitmp4.mp4`);
    const endVideoPath = path.join(__dirname, '..', '/readyVideos', `${story.ttsFileName}.mp4`);
    console.info(`End video path: ${endVideoPath}`);
    console.info(`Video path: ${videoPath}`);
    const buffer = fs.readFileSync(ttsPath);
    const duration = getMP3Duration(buffer);
    const secondDuration = (duration / 1000)+1;
    console.info(`Duration: ${secondDuration}`);
    console.info(`Making video for story ${story.storyId}`);

    const subtitles = createSubtitles(story.mergedChunks, secondDuration-1); 

    console.info(`Subtitles: ${JSON.stringify([
      {
        type: 'video',
        path: videoPath,
        cutFrom: 0,
        cutTo: secondDuration,
      },
      ...subtitles,
    ], null, 2)}`);

    const editSpec = {
      outPath: endVideoPath,
      width: 480,
      height: 854,
      fps: 25,
      allowRemoteRequests: false,
      defaults: {
        duration: secondDuration,
        transition: {
          duration: 0,
          name: 'random',
          audioOutCurve: 'tri',
          audioInCurve: 'tri',
        },
        // layer: {
        //   fontPath,
        //   // ...more layer defaults
        // },
        // layerType: {
        //   'fill-color': {
        //     color: '#ff6666',
        //   }
        //   // ...more per-layer-type defaults
        // },
      },
      clips: [
        {
          // transition,
          layers: [ 
            {
              type: 'video',
              path: videoPath,
              cutFrom: 0,
              cutTo: secondDuration,
            },
            ...subtitles,
          ],
        }
      ],
      audioFilePath: ttsPath,
      loopAudio: false,
      keepSourceAudio: false,
      clipsAudioVolume: 1,
      outputVolume: 1,
      audioTracks: [
        {
          path: ttsPath,
          mixVolume: 1,
          cutFrom: 0,
          // cutTo:,
          start: 0,
        },
        // ...more audio tracks
      ],
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