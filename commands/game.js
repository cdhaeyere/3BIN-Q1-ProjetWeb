const { SlashCommandBuilder } = require('discord.js');
const init = require("../lib/init");
const gameStartRound = require("../lib/gameStartRound");
const Roles = require("../lib/Roles");
const seerTurn = require("../lib/seer_turn");
const werewolfTurn = require("../lib/werewolf_turn");
const littleGirlTurn = require("../lib/little_girl_turn");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Starts a werewolf game'),
    async execute(interaction) {
        let lovers = [];

        const { players, channels } = await init(interaction);

        let mainChannel = channels.find(c => c.role === null)?.channel;

        await gameStartRound(
            players,
            channels.find(c => c.role === Roles.THIEF)?.channel,
            channels.find(c => c.role === Roles.CUPID)?.channel,
            mainChannel,
            lovers
        );

        //TODO Normal tour
        while (true) {
            let deadThisRound = [];

            if (players.find(p => p.role === Roles.SEER)?.isDead === false) {
                mainChannel.send('C\'est a la voyante de jouer');

                await seerTurn(
                    interaction,
                    channels.find(c => c.role === Roles.SEER)?.channel,
                    players
                );
            }

            mainChannel.send('C\'est aux loups-garoux de jouer');
            await werewolfTurn(
                players,
                deadThisRound,
                channels.find(c => c.role === Roles.WEREWOLF)?.channel
            );

            if (players.find(p => p.role === Roles.LITTLE_GIRL)?.isDead === false) {
                mainChannel.send('C\'est a la petite fille de jouer');

                await littleGirlTurn(
                    channels.find(c => c.role === Roles.LITTLE_GIRL)?.channel,
                    players
                );
            }
        }

        //TODO Delete channels

        // await deleteChannels(channels);
    }
};