const Train = require("../models/train.mongo.js");
const axios = require("axios");
const marked = require("marked");

const getTrainInfo = async () => {
  // get the mastodon posts from the zssk account through the api
  console.info("Getting ZSSK train info from the mastodon API");
  const { data } = await axios.get(
    "https://mastodon.social/api/v1/accounts/110689585617761822/statuses"
  );

  return (cleanResponse = data.map((item) => ({
    id: Number(item.id),
    date: item.created_at,
    content: item.content.replace(/<[^>]+>/g, ""), // This will remove HTML tags
    url: item.url,
  })));
};

const saveTrainInfoToDatabase = async (trains) => {
  console.info("Attempting to save trains to database");
  let coutner = 0;
  // save to database, but if already in mongo database, don't save
  trains.forEach(async (train) => {
    const trainExists = await Train.exists({ id: train.id });
    if (!trainExists) {
      console.info(`Saving train ${train.id} to database`);
      await Train.create(train);
      coutner++;
    }
  });
  console.info(
    `Saved ${coutner} trains to database, skipped ${
      trains.length - coutner
    } trains`
  );
};

const getUnesntTrains = async () => {
  // get all trains that were not sent yet and set wasSent to true
  console.info("Trying to retrieve unsent trains from database");
  const trains = await Train.find({ wasSent: false });
  console.info(`Found ${trains.length} unsent trains`);
  trains.forEach(async (train) => {
    await Train.updateOne({ _id: train._id }, { wasSent: true });
  });
  // sort the trains by date from oldest to newest
  trains.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  return trains;
};

const getTrainFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalTrains = await Train.countDocuments();
        const totalPages = Math.ceil(totalTrains / limit);

        const trains = await Train.find()
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        res.render('news', {
            items: trains.map(train => ({
                content: marked.parse(`## ${train.content}\n\n*${new Date(train.date).toLocaleString('sk-SK')}*\n\n[Zobraziť na Mastodon »](${train.url})`)
            })),
            pagination: {
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            title: 'Vlaky'
        });
    } catch (error) {
        console.error('Error fetching train updates:', error);
        res.status(500).render('error', { message: 'Chyba pri načítaní aktualizácií vlakov.' });
    }
};

module.exports = {
  getTrainInfo,
  saveTrainInfoToDatabase,
  getUnesntTrains,
  getTrainFeed,
};
