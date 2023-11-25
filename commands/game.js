const { SlashCommandBuilder } = require('discord.js');
const init = require("../lib/init");
const gameStartRound = require("../lib/gameStartRound");
const Roles = require("../lib/Roles");
const seerTurn = require("../lib/seer_turn");

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
            channels.find(c => c.role === null)?.channel,
            lovers
        );

        //TODO Normal tour
        if (players.find(p => p.role === Roles.SEER).isDead === false) {
            channels.find(c => c.role === null)?.channel.send('C\'est a la voyante de jouer');

            await seerTurn(
                interaction,
                channels.find(c => c.role === Roles.SEER)?.channel,
                players
            );
        }


        //TODO Delete channels

        // await deleteChannels(channels);
    }
};