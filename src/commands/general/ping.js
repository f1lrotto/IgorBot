const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    // get a random number between 0 and 10
    const random = Math.floor(Math.random() * 10);
    // if the random number is 0, respond with Kokot lol, else Pong!
    if (random === 0) {
      return interaction.reply('Kokot lol');
    }
    return interaction.reply('Pong!');
  },
};