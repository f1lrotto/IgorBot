const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const Train = require("../../models/train.mongo.js");

const moment = require("moment-timezone");
moment.tz.setDefault("Europe/Bratislava");

const config = {
  train: {
    username: "NestiháčikVláčik",
    avatarURL: "https://cdn.discordapp.com/attachments/457885524292665348/1166862329904898068/thomas-the-tank-engine-screaming-as-he-travels-through-v0-eeux64f7ahha1.png?ex=654c083a&is=6539933a&hm=1f4e63a5ff71421b8ca3689280e0ef2d3b28ebb986fcb67a92ecd9733b25b46d&"
  },
};

const getRecentTrains = async () => {
  try {
    // Calculate the time 3 hours ago from now
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    // Get all trains that have a date within the last 3 hours
    console.info("Trying to retrieve recent trains from database");
    const recentTrains = await Train.find({ date: { $gte: threeHoursAgo } }).sort({ date: 1 });

    console.info(`Found ${recentTrains.length} recent trains`);

    // The trains are already sorted by date from oldest to newest due to the `.sort({ date: 1 })` query modifier
    return recentTrains;
  } catch (error) {
    console.error("Error retrieving recent trains from database:", error);
    throw error;
  }
}



function createTrainEmbed(train) {
  return new EmbedBuilder()
    .setColor(0xfc9d03)
    .setTitle(train.content)
    .setURL(train.url)
    .setAuthor({ name: 'Železničná spoločnosť Slovensko', url: 'https://mastodon.social/@zssk_mimoriadne', iconURL: config.train.avatarURL })
    .setTimestamp(new Date(moment(train.date).toISOString()))
    .setFooter({ text: 'ZSSK' });
}

function buidTrainDelayEmbeds(items) {
  // filter out the items to only those which have "mešk" in the content
  items = items.filter(item => item.content.toLowerCase().includes("mešk"));
  const embeds = items.map(createTrainEmbed);
  embeds.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  return embeds;
}


module.exports = {
  data: new SlashCommandBuilder()
    .setName('train-delay')
    .setDescription('Returns train delays from the past 3 hours'),
  async execute(interaction) {
    const trains = await getRecentTrains();
    const embeds = buidTrainDelayEmbeds(trains);
    console.info(`Attempting to send ${embeds.length} train delay embeds to Discord`);
    // send only 10 embeds at a time
    for (let i = 0; i < embeds.length; i += 10) {
      const batch = embeds.slice(i, i + 10);
      console.info(`Sending ${batch.length} embeds in batch ${Math.floor(i / 10) + 1}`);
      await interaction.reply({
        embeds: batch,
      });
    }
  },
};