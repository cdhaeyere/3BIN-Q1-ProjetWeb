const Roles = require("./Roles");
const {
    ActionRowBuilder, ButtonBuilder, Colors,
    EmbedBuilder, ButtonStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} = require("discord.js");
const {renewCupidChannel} = require("./setup_channels");

const gameStartRound = async (playerList, channelThief, channelCupid, loverList) => {
    return new Promise(async (resolve) => {
        const thief = playerList.find((player) => player.role === Roles.THIEF);
        if (thief !== undefined) await thiefActions(thief, playerList, channelThief);

        const cupid = playerList.find((player) => player.role === Roles.CUPID);
        if (cupid !== undefined) await cupidActions(cupid, playerList, channelCupid, loverList);

        resolve();
    });
}

const thiefActions = async (thief, playerList, channelThief) => {
    return new Promise(async (resolve) => {
        const select = new StringSelectMenuBuilder()
            .setCustomId('thiefChoise')
            .setPlaceholder('Joueur');

        playerList.forEach((user) => {
            if (user.player.id !== thief.player.id)
                select.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(user.player.displayName)
                        .setDescription('Voulez vous échanger votre carte avec ce joueur ?')
                        .setValue(user.player.id)
                );
        });
        const row = new ActionRowBuilder()
            .addComponents(select);

        const embed = new EmbedBuilder()
            .setTitle(`${playerList.find((player) => player === thief).role}`)
            .setDescription(`Choisissez un joueur avec qui échanger de carte`)
            .setColor(Colors.Blue);

        await channelThief.send({embeds: [embed], components: [row]});

        const collector = channelThief.createMessageComponentCollector({
            filter: i => i.user.id === thief.player.id,
            time: 60_000});

        collector.on('collect', async i => {
            collector.stop();
            const userSelected = await i.guild.members.fetch(i.values[0]);
            const playerSelected = playerList.find(p => p.player.id === userSelected.id);

            const descpt = `Le Role de ${playerSelected.player.displayName} est ${playerSelected.role}.`;
            const embed = new EmbedBuilder()
                .setTitle('Voleur')
                .setDescription(playerSelected.role !== Roles.WEREWOLF ? descpt + ` Voulez vous échanger votre carte avec lui ?` : descpt + ` Vous avez pris sa carte.`)
                .setColor(Colors.Blue);

            if (playerSelected.role === Roles.WEREWOLF) {
                playerList.find(p => p === playerSelected).role = Roles.VILLAGER;
                playerList.find(p => p === thief).role = Roles.WEREWOLF;

                await i.update({embeds: [embed], components: []});
                resolve();
            } else {
                const okBtn = new ButtonBuilder()
                    .setCustomId("okBtn")
                    .setLabel("Oui")
                    .setStyle(ButtonStyle.Success);

                const nokBtn = new ButtonBuilder()
                    .setCustomId("nokBtn")
                    .setLabel("Non")
                    .setStyle(ButtonStyle.Danger);

                const rowBtn = new ActionRowBuilder().addComponents(okBtn, nokBtn);
                await i.update({embeds: [embed], components: [rowBtn]});

                const collector = channelThief.createMessageComponentCollector({
                    filter: i => i.user.id === thief.player.id,
                    time: 60_000
                });

                collector.on('collect', async i => {
                    collector.stop();
                    if (i.customId === 'okBtn') {
                        const nvRole = playerSelected.role;
                        playerList.find((player) => player === playerSelected).role = Roles.VILLAGER;
                        playerList.find((player) => player === thief).role = nvRole;
                    } else if (i.customId === 'nokBtn') {
                        playerList.find((player) => player === thief).role = Roles.VILLAGER;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`${playerList.find((player) => player === thief).role}`)
                        .setDescription(`Vous êtes maintenant : ${playerList.find((player) => player === thief).role}`)
                        .setColor(Colors.Blue);

                    await i.update({embeds: [embed], components: []});

                    resolve();
                });
            }
        });
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
            .setTitle('Cupid')
            .setDescription(`Choisissez les âmes soeurs`)
            .setColor(Colors.Blue);

        await channelCupid.send({embeds: [embed], components: [row]});

        const collector = channelCupid.createMessageComponentCollector({
            filter: i => i.user.id === cupid.player.id,
            time: 60_000
        });

        collector.on('collect', async i => {
            collector.stop();

            loverList.push(playerList.find(p => p.player.id === i.values[0]));
            loverList.push(playerList.find(p => p.player.id === i.values[1]));

            const embed = new EmbedBuilder()
                .setTitle('Cupid')
                .setDescription(`Les âmes soeurs sont ${loverList[0].player.displayName} et ${loverList[1].player.displayName}.`)
                .setColor(Colors.Blue);

            await i.update({embeds: [embed], components: []});

            await renewCupidChannel(channelCupid, cupid, loverList);

            channelCupid.send(`<@${loverList[0].player.id}> <@${loverList[1].player.id}>`);

            resolve();
        });
    });
}

module.exports = gameStartRound;
