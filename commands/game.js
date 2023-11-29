const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, Colors} = require('discord.js');
const init = require("../lib/init");
const gameStartRound = require("../lib/gameStartRound");
const Roles = require("../lib/Roles");
const seerTurn = require("../lib/seer_turn");
const werewolfTurn = require("../lib/werewolf_turn");
const littleGirlTurn = require("../lib/little_girl_turn");
const witchTurn = require("../lib/witchTurn");
const night_end = require("../lib/nigth_end");
const {deleteChannels} = require("../lib/setup_channels");
const { playSound, joinChannel, Sounds, leaveChannel } = require('../lib/sound');

let inGame = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Starts a werewolf game'),
    async execute(interaction) {
        if (inGame === true) {
            await interaction.reply({ content: 'Un Loup-Garou est déjà en cours' });
            return
        }
        inGame = true;
        let lovers = [];

        let players, channels, thiefRoles;
        try {
            ({ players, channels, thiefRoles } = await init(interaction));
        } catch (e) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('Erreur')
                .setColor(Colors.Red)
                .setDescription('Vous n\'avez pas répondu a temps');

            await interaction.channel.send({ embeds: [errorEmbed], ephemeral: true });

            inGame = false;

            return;
        }

        const connection = await joinChannel(channels.find(c => c.role === null && c.channel.type === ChannelType.GuildVoice)?.channel);

        let mainChannel = channels.find(c => c.role === null)?.channel;

        const pingAllPlayers = players.map(p => `<@${p.player.id}>`).join(' ');

        mainChannel.send({ content: pingAllPlayers});

        const nightFallsEmbed = new EmbedBuilder()
            .setTitle("🌟 La nuit tombe 🌙")
            .setDescription("Le village s'endort");

        let prepRound = false;
        if (players.find(p => p.role === Roles.CUPID) || players.find(p => p.role === Roles.THIEF)) {
            prepRound = true;
            
            await playSound(connection, Sounds.NIGHT);
            await mainChannel.send({ embeds: [nightFallsEmbed] });

            const startRound = new EmbedBuilder()
                .setTitle("Jeu")
                .setDescription("Début du tour de préparation");

            await mainChannel.send({ embeds: [startRound] });

            channels = await gameStartRound(
                players,
                mainChannel,
                lovers,
                thiefRoles,
                channels,
                connection
            );
        }

        let loupGarouCount = players.filter(player => player.role === Roles.WEREWOLF && !player.isDead).length;
        let alivePlayers = players.filter(player => !player.isDead && player.role !== Roles.WEREWOLF).length;
        while (loupGarouCount <= alivePlayers / 2) {
            let deadThisRound = [];

            if (!prepRound) {
                await playSound(connection, Sounds.NIGHT);
                await mainChannel.send({ embeds: [nightFallsEmbed] });
                prepRound = false;
            }

            if (players.find(p => p.role === Roles.SEER)?.isDead === false) {
                await playSound(connection, Sounds.SEER);
                await mainChannel.send('C\'est a la voyante de jouer 🔮');

                await seerTurn(
                    interaction,
                    channels.find(c => c.role === Roles.SEER)?.channel,
                    players
                );
            }

            await playSound(connection, Sounds.WOLVES);
            await mainChannel.send('C\'est aux Loups-Garous de jouer 🐺');
            deadThisRound = await werewolfTurn(
                players,
                deadThisRound,
                channels.find(c => c.role === Roles.WEREWOLF)?.channel
            );

            if (players.find(p => p.role === Roles.LITTLE_GIRL)?.isDead === false) {
                await playSound(connection, Sounds.GIRL)
                await mainChannel.send('C\'est a la petite fille de jouer 👧');

                await littleGirlTurn(
                    channels.find(c => c.role === Roles.LITTLE_GIRL)?.channel,
                    players
                );
            }

            const witch = players.find(p => p.role === Roles.WITCH);
            if (!witch?.isDead && (witch?.lifePotion || witch?.deathPotion)) {
                await playSound(connection, Sounds.WITCH);
                await mainChannel.send('C\'est a la sorcière de jouer 🧙🌟');

                await witchTurn(
                    deadThisRound,
                    channels.find(c => c.role === Roles.WITCH)?.channel,
                    witch,
                    players
                );
            }

            await night_end(
                players,
                deadThisRound,
                lovers,
                mainChannel,
                connection
            );

            loupGarouCount = players.filter(player => player.role === Roles.WEREWOLF && !player.isDead).length;
            alivePlayers = players.filter(player => !player.isDead && player.role !== Roles.WEREWOLF).length;

            if (loupGarouCount < 1) {
                const embed = new EmbedBuilder()
                    .setTitle('VICTOIRE DU VILLAGE!');

                await mainChannel.send({ embeds: [embed] });
                break;
            } else if (loupGarouCount > alivePlayers / 2) {
                const embed = new EmbedBuilder()
                    .setTitle('VICTOIRE DES LOUPS-GAROUS!');

                await mainChannel.send({ embeds: [embed] });
                break;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Fin du jeu!')
            .setDescription('Merci d\'avoir joué');

        const btn = new ButtonBuilder()
            .setCustomId("delete")
            .setLabel("Supprimer les channels")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(btn);

        await mainChannel.send({ embeds: [embed], components: [row] });

        const collector = await mainChannel.createMessageComponentCollector({time: 60_000});

        collector.on('collect', async i => {
            collector.stop();
        });

        collector.on('end', async collected => {
            await leaveChannel(connection);
            await deleteChannels(channels);
            inGame = false;
        });
    }
};
