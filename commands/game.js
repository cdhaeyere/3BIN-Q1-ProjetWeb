const { SlashCommandBuilder } = require('discord.js');
const init = require("../lib/init");
const gameStartRound = require("../lib/gameStartRound");
const Roles = require("../lib/Roles");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Starts a werewolf game'),
    async execute(interaction) {
        let lovers = [];

        const { players, channels } = await init(interaction);

        await gameStartRound(
            players,
            channels.find(c => c.role === Roles.THIEF)?.channel,
            channels.find(c => c.role === Roles.CUPID)?.channel,
            lovers
        );

        //TODO Preparation tour

        //TODO Normal tour

        //TODO Delete channels

        // await deleteChannels(channels);
    }
};