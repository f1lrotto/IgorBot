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

const getTrains = async () => {
  try {
    // Get all trains that have a date within the last 3 hours
    console.info("Trying to retrieve recent trains from database");
    const recentTrains = await Train.find({}).sort({ date: 1 });

    console.info(`Found ${recentTrains.length} trains`);

    // The trains are already sorted by date from oldest to newest due to the `.sort({ date: 1 })` query modifier
    return recentTrains;
  } catch (error) {
    console.error("Error retrieving recent trains from database:", error);
    throw error;
  }
}


function createTrainEmbed(train) {
  return new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(`💀💀💀 ${train.content} 💀💀💀`)
    .setURL(train.url)
    .setAuthor({ name: 'Železničná spoločnosť Pohrebisko', url: 'https://mastodon.social/@zssk_mimoriadne', iconURL: config.train.avatarURL })
    .setTimestamp(new Date(moment(train.date).toISOString()))
    .setFooter({ text: 'ZSSK' });
}

function buidTrainDelayEmbeds(items) {
  // filter out the items to only those which have "mešk" in the content
  items = items.filter(item => item.content.toLowerCase().includes("neoprávnene sa pohybujúcu"));
  const embeds = items.map(createTrainEmbed);
  embeds.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  return embeds;
}


module.exports = {
  data: new SlashCommandBuilder()
    .setName('train-death')
    .setDescription('Returns recent train deaths'),
  async execute(interaction) {
    const trains = await getTrains();
    const embeds = buidTrainDelayEmbeds(trains);
    console.info(`Attempting to send ${embeds.length} train delay embeds to Discord`);
    // send only 10 embeds at most
    const batch = embeds.slice(0, 10);
    console.info(`Sending ${batch.length} embeds`);
    await interaction.reply({
      embeds: batch,
    });
  },
};