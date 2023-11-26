const Roles = require("./Roles");
const {ActionRowBuilder, Colors, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require("discord.js");
const {renewCupidChannel, addUserToChannel} = require("./setup_channels");
const {playSound, Sounds} = require("./sound");

const gameStartRound = async (playerList, channelGeneral, loverList, thiefRoles, channels, connection) => {
    return new Promise(async (resolve) => {
        let newThiefChannel = channels;

        const thief = playerList.find((player) => player.role === Roles.THIEF);
        if (thief !== undefined) {
            await playSound(connection, Sounds.THIEF);
            await channelGeneral.send('C\'est au voleur de jouer 🥷');
            newThiefChannel = await thiefActions(thief, playerList, channels.find(c => c.role === Roles.THIEF)?.channel, thiefRoles, channels);
        }

        const cupid = playerList.find((player) => player.role === Roles.CUPID);
        if (cupid !== undefined) {
            await playSound(connection, Sounds.CUPID);
            await channelGeneral.send('C\'est a Cupidon de jouer 💘');
            await cupidActions(cupid, playerList, newThiefChannel.find(c => c.role === Roles.CUPID)?.channel, loverList);
        }

        resolve(newThiefChannel);
    });
}

const thiefActions = async (thief, playerList, channelThief, thiefRoles, channels) => {
    return new Promise(async (resolve) => {
        if (thiefRoles.includes(Roles.WEREWOLF)) {
            const embed = new EmbedBuilder()
                .setTitle(Roles.THIEF)
                .setDescription(`Vu qu'une des deux cartes est un Loup-Garou vous êtes désormais un Loup-Garou`)
                .setColor(Colors.Blue)
                .setFooter({
                    "text": `Les deux roles étaient ${thiefRoles.join(', ')}`,
                });

            await channelThief.send({content: `<@${thief.player.id}>`, embeds: [embed]});

            thief.role = Roles.WEREWOLF;
            const newThiefChannel = await addUserToChannel(channels, thief);

            resolve(newThiefChannel);
        } else {
            const embed = new EmbedBuilder()
                .setTitle(Roles.THIEF)
                .setDescription(`Choisissez un role que vous souhaitez voler`)
                .setColor(Colors.Blue)
                .setFooter({
                    "text": "Vous avez 30 secondes pour choisir un role.",
                });

            const select = new StringSelectMenuBuilder()
                .setCustomId('thiefChoise')
                .setPlaceholder('Roles');

            thiefRoles.forEach((role, index) => {
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(role)
                        .setValue(`${role}${index}`)
                );
            });

            const row = new ActionRowBuilder()
                .addComponents(select);

            const msg = await channelThief.send({content: `<@${thief.player.id}>`, embeds: [embed], components: [row]});

            const collector = channelThief.createMessageComponentCollector({
                filter: i => i.user.id === thief.player.id,
                time: 30_000});

            collector.on('collect', async i => {
                collector.stop();

                thief.role = i.values[0].slice(0, -1);

                const embed = new EmbedBuilder()
                    .setTitle(Roles.THIEF)
                    .setDescription(`Vous êtes désormais ${thief.role}`)
                    .setColor(Colors.Blue);

                i.update({ embeds: [embed], components: [] });

                const newThiefChannel = await addUserToChannel(channels, thief);
                resolve(newThiefChannel);
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    msg.delete();

                    const errorEmbed = new EmbedBuilder()
                        .setTitle(Roles.THIEF)
                        .setColor(Colors.Red)
                        .setDescription('Vous n\'avez pas répondu a temps, vous passez votre tour');

                    await channelThief.send({embeds: [errorEmbed]});
                }
            });
        }
    });
}

const cupidActions = async (cupid, playerList, channelCupid, loverList) => {
    return new Promise(async (resolve) => {
        const select = new StringSelectMenuBuilder()
            .setCustomId('CupidChoise')
            .setPlaceholder('Joueurs')
            .setMinValues(2)
            .setMaxValues(2);

        playerList.forEach((user) => {
            select.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(user.player.displayName)
                    .setDescription('Voulez vous choisir ce joueur ?')
                    .setValue(user.player.id)
            );
        });

        const row = new ActionRowBuilder().addComponents(select);

        const embed = new EmbedBuilder()
            .setTitle(Roles.CUPID)
            .setDescription(`Choisissez les âmes soeurs`)
            .setColor(Colors.Blue)
            .setFooter({
                "text": "Vous avez 30 secondes pour choisir un joueur.",
            });

        const msg = await channelCupid.send({content: `<@${cupid.player.id}>`, embeds: [embed], components: [row]});

        const collector = channelCupid.createMessageComponentCollector({
            filter: i => i.user.id === cupid.player.id,
            time: 30_000
        });

        collector.on('collect', async i => {
            collector.stop();

            loverList.push(playerList.find(p => p.player.id === i.values[0]));
            loverList.push(playerList.find(p => p.player.id === i.values[1]));

            const embed = new EmbedBuilder()
                .setTitle(Roles.CUPID)
                .setDescription(`Les âmes soeurs sont ${loverList[0].player.displayName} et ${loverList[1].player.displayName}.`)
                .setColor(Colors.Blue);

            await i.update({embeds: [embed], components: []});

            await renewCupidChannel(channelCupid, cupid, loverList);

            channelCupid.send(`<@${loverList[0].player.id}> <@${loverList[1].player.id}>`);

            resolve();
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                msg.delete();

                const errorEmbed = new EmbedBuilder()
                    .setTitle(Roles.CUPID)
                    .setColor(Colors.Red)
                    .setDescription('Vous n\'avez pas répondu a temps, vous passez votre tour');

                await channelCupid.send({embeds: [errorEmbed]});
            }
        });
    });
}

module.exports = gameStartRound;
