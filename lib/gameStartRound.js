const Roles = require("./Roles");
const {
    ActionRowBuilder, ButtonBuilder, Colors,
    EmbedBuilder, ButtonStyle,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} = require("discord.js");

const gameStartRound = async (playerList, chanelThief, chanelCupid, loverList) => {
    return new Promise(async (resolve) => {
        const thief = playerList.find((player) => player.role === Roles.THIEF)
        if (thief !== undefined) await thiefActions(thief, playerList, chanelThief)
        const cupid = playerList.find((player) => player.role === Roles.CUPID)
        if (cupid !== undefined) await cupidActions(cupid, playerList, chanelCupid, loverList)

        resolve()
    })
}

const thiefActions = async (thief, playerList, chanelThief) => {
    return new Promise(async (resolve) => {
            const select = new StringSelectMenuBuilder()
                .setCustomId('thiefChoise')
                .setPlaceholder('Joueur');
            playerList.forEach((user) => {
                if (user.player.id !== thief.player.id)
                    select.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(user.player.displayName)
                            .setDescription('Voulez vous echanger votre carte avec ce joueur')
                            .setValue(user.player.id)
                    )
            })
            const row = new ActionRowBuilder()
                .addComponents(select)
            const collectorFilter = i => i.user.id === thief.player.id

            const collector = chanelThief.createMessageComponentCollector({filter: collectorFilter, time: 60_000})

            collector.on('collect', async i => {
                collector.stop()
                const userSelected = await i.guild.members.fetch(i.values[0])

                const playerSelected = playerList.find((player) => player.player.id === userSelected.id)
                const descpt = `Le Role de ${playerSelected.player.displayName} est ${playerSelected.role}.`

                const embed = new EmbedBuilder()
                    .setTitle('Voleur')
                    .setDescription(playerSelected.role !== Roles.WEREWOLF ? descpt + ` Voulez vous échanger votre carte avec lui ?` : descpt + ` Vous avez pris sa carte.`)
                    .setColor(Colors.Blue)

                if (playerSelected.role === Roles.WEREWOLF) {

                    playerList.find((player) => player === playerSelected).role = Roles.VILLAGER
                    playerList.find((player) => player === thief).role = Roles.WEREWOLF

                    await i.update({embeds: [embed], components: []})
                    resolve()

                } else {
                    const okBtn = new ButtonBuilder()
                        .setCustomId("okBtn")
                        .setLabel("Oui")
                        .setStyle(ButtonStyle.Success)

                    const nokBtn = new ButtonBuilder()
                        .setCustomId("nokBtn")
                        .setLabel("Non")
                        .setStyle(ButtonStyle.Danger)

                    const rowBtn = new ActionRowBuilder()
                        .addComponents(okBtn, nokBtn);
                    await i.update({embeds: [embed], components: [rowBtn]})
                    const collectorFilter = i => i.user.id === thief.player.id

                    const collector = chanelThief.createMessageComponentCollector({filter: collectorFilter, time: 60_000})

                    collector.on('collect', async i => {
                        collector.stop();
                        if (i.customId === 'okBtn') {
                            const nvRole = playerSelected.role
                            playerList.find((player) => player === playerSelected).role = Roles.VILLAGER
                            playerList.find((player) => player === thief).role = nvRole
                        } else if (i.customId === 'nokBtn') {
                            playerList.find((player) => player === thief).role = Roles.VILLAGER
                        }

                        const embed = new EmbedBuilder()
                            .setTitle(`${playerList.find((player) => player === thief).role}`)
                            .setDescription(`Vous êtes maintenant : ${playerList.find((player) => player === thief).role}`)
                            .setColor(Colors.Blue)
                        await i.update({embeds: [embed], components: []})
                        resolve()
                    })
                }
            })
            const embed = new EmbedBuilder()
                .setTitle(`${playerList.find((player) => player === thief).role}`)
                .setDescription(`Choisissez un joueur avec qui echanger de carte`)
                .setColor(Colors.Blue)
            await chanelThief.send({embeds: [embed], components: [row]})
        }
    )

}
const cupidActions = async (cupid, playerList, chanelCupid, loverList) => {
    return new Promise(async (resolve) => {

        const select = new StringSelectMenuBuilder()
            .setCustomId('CupidChoise')
            .setPlaceholder('Joueur');
        playerList.forEach((user) => {
            select.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(user.player.displayName)
                    .setDescription('Voulez vous choisir ce joueur')
                    .setValue(user.player.id)
            )
        })
        const row = new ActionRowBuilder()
            .addComponents(select)
        const collectoraFilter = i => i.user.id === cupid.player.id

        const collectora = chanelCupid.createMessageComponentCollector({filter: collectoraFilter, time: 60_000})
        collectora.on('collect', async i => {
            collectora.stop()
            const userSelected = await i.guild.members.fetch(i.values[0])
            loverList.push( playerList.find((player) => player.player.id === userSelected.id))
            const embed = new EmbedBuilder()
                .setTitle('Cupid')
                .setDescription(`Choisissez l'ame soeur de ${userSelected.displayName}.`)
                .setColor(Colors.Blue)

            const select = new StringSelectMenuBuilder()
                .setCustomId('CupidChoiseLover')
                .setPlaceholder('Joueur');
            playerList.forEach((user) => {
                if (user.player.id !== userSelected.id) {
                    select.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(user.player.displayName)
                            .setDescription('Voulez vous choisir ce joueur')
                            .setValue(user.player.id)
                    )
                }
            })

            const row = new ActionRowBuilder()
                .addComponents(select)
            const collectorFilter = i => i.user.id === cupid.player.id

            const collector = chanelCupid.createMessageComponentCollector({filter: collectorFilter, time: 60_000})
            collector.on('collect', async i => {
                collector.stop()
                const userSelected = await i.guild.members.fetch(i.values[0])
                loverList.push(playerList.find((player) => player.player.id === userSelected.id))
                const embed = new EmbedBuilder()
                    .setTitle('Cupid')
                    .setDescription(`Les ames soeur son ${ loverList[0].player.displayName } et ${ loverList[1].player.displayName }.`)
                    .setColor(Colors.Blue)
                await i.update({embeds: [embed], components: []})
                resolve()
            })
            await i.update({embeds: [embed], components: [row]})
        })
        const embed = new EmbedBuilder()
            .setTitle('Cupid')
            .setDescription(`Choisissez la première ame soeur.`)
            .setColor(Colors.Blue)

        await chanelCupid.send({embeds: [embed], components: [row]})
    })
}

module.exports = gameStartRound;