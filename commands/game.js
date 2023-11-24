const { SlashCommandBuilder } = require('discord.js');
const init = require("../lib/init");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Starts a werewolf game'),
    async execute(interaction) {
        const { players, channels } = await init(interaction);

        //TODO Preparation tour

        //TODO Normal tour

        //TODO Delete channels

        // await deleteChannels(channels);
    }
};