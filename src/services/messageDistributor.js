const { EmbedBuilder } = require('discord.js');
const ServerConfig = require('../models/ServerConfig');
const moment = require('moment-timezone');

moment.tz.setDefault('Europe/Bratislava');

const articleCategoryConfig = {
    'Domov': {
        color: 0xc73636,
        categoryUrl: 'https://www.sme.sk/minuta/rubrika/7761/domov',
        iconURL: 'https://cdn.discordapp.com/attachments/457885524292665348/1154878264049930250/image.png'
    },
    'Svet': {
        color: 0xd9d918,
        categoryUrl: 'https://www.sme.sk/minuta/rubrika/7763/svet',
        iconURL: 'https://cdn.discordapp.com/attachments/457885524292665348/1154879552733061120/image.png'
    },
    'Ekonomika': {
        color: 0x207ae3,
        categoryUrl: 'https://www.sme.sk/minuta/rubrika/7764/ekonomika',
        iconURL: 'https://cdn.discordapp.com/attachments/457885524292665348/1154878891941433458/image.png'
    },
    'Regióny': {
        color: 0x972fd4,
        categoryUrl: 'https://www.sme.sk/minuta/rubrika/7768/regiony',
        iconURL: 'https://cdn.discordapp.com/attachments/457885524292665348/1154880664173301760/image.png'
    }
};

function createNewsEmbed(article) {
    const category = article.category || 'Uncategorized';
    const config = articleCategoryConfig[category] || {
        color: 0x808080,
        iconURL: 'https://example.com/default-icon.png'
    };

    return new EmbedBuilder()
        .setColor(config.color)
        .setTitle(article.title)
        .setURL(article.link)
        .setDescription(article.description)
        .setTimestamp(new Date(article.pubDate))
        .setFooter({
            text: category,
            iconURL: config.iconURL
        });
}

function createTrainEmbed(train) {
    return new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Train Delay Alert')
        .setDescription(train.description)
        .setTimestamp();
}

function createFormulaEmbed(article) {
    return new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(article.title)
        .setURL(article.link)
        .setDescription(article.description)
        .setTimestamp(new Date(article.pubDate));
}

async function distributeMessages(client, type, items, createEmbed) {
    try {
        // Get all server configurations that have this type of channel configured
        const configs = await ServerConfig.find({ [`channels.${type}`]: { $ne: null } });
        
        // Create embeds in batches of 10 (Discord's limit)
        const embeds = items.map(item => createEmbed(item));
        const batches = [];
        for (let i = 0; i < embeds.length; i += 10) {
            batches.push(embeds.slice(i, i + 10));
        }

        // Send to each configured channel
        for (const config of configs) {
            const channelId = config.channels[type];
            const channel = await client.channels.fetch(channelId);
            
            if (!channel) {
                console.log(`Channel ${channelId} not found for guild ${config.guildId}`);
                continue;
            }

            for (const batch of batches) {
                await channel.send({ embeds: batch });
            }
        }
    } catch (error) {
        console.error(`Error distributing ${type} messages:`, error);
    }
}

module.exports = {
    async sendNewsMessages(client, articles) {
        await distributeMessages(client, 'news', articles, createNewsEmbed);
    },

    async sendTrainMessages(client, trains) {
        await distributeMessages(client, 'train', trains, createTrainEmbed);
    },

    async sendFormulaMessages(client, articles) {
        await distributeMessages(client, 'formula', articles, createFormulaEmbed);
    }
};
