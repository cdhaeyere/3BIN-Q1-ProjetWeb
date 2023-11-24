const {
    ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder, Colors
} = require('discord.js');

const witchTurn = async (victims, channel, witch, playerList) => {
    return new Promise(async (resolve) => {

        if ((!witch.lifePotion && !witch.deathPotion) || witch.isDead ) {
            return resolve()
        }

        const victim = victims[0]

        const embed = new EmbedBuilder()
            .setTitle('Sorcière')
            .setDescription( witch.lifePotion ? `Voulez vous sauvé ${victim.player.displayName} ?` : 'Voulez vous utilisez votre postion de poison')
            .setColor(Colors.Blue);

        const okBtn = new ButtonBuilder()
            .setCustomId("okBtn")
            .setLabel("Oui")
            .setStyle(ButtonStyle.Success)

        const nokBtn = new ButtonBuilder()
            .setCustomId("nokBtn")
            .setLabel("Non")
            .setStyle(ButtonStyle.Danger)

        const row = new ActionRowBuilder()
            .addComponents(okBtn, nokBtn);


        const collectorFilter = i => i.user.id === witch.player.id; // => witch id


        const collector = await channel.createMessageComponentCollector({filter: collectorFilter, time: 60_000});

        collector.on('collect', async i => {

            collector.stop();

            if (i.customId === 'okBtn') {

                if (!witch.lifePotion) {
                    await killPossion(i)
                }else
                {
                    const embed = new EmbedBuilder()
                        .setTitle('Sorcière')
                        .setDescription(`Le joueur ${victim.player.displayName} est sain et sauf.`)
                        .setColor(Colors.Blue)
                    victims.pop()
                    witch.lifePotion = false
                    await i.update({embeds: [embed], components: []})
                    resolve()
                }

            } else if (i.customId === 'nokBtn') {
                // killFunc
                if (!witch.lifePotion) {
                    const embed = new EmbedBuilder()
                        .setTitle('Sorcière')
                        .setDescription(`Vous n'utiliser pas de potion ce tour.`)
                        .setColor(Colors.Blue)

                    await i.update({embeds: [embed], components: []})
                    return  resolve(true)
                }
                const embed = new EmbedBuilder()
                    .setTitle('Sorcière')
                    .setDescription( witch.deathPotion ? `Le joueur ${victim.player.displayName} n'est pas sauver. Voulez vous tuer un autre joueur?` : `Le joueur ${victim.player.displayName} n'est pas sauver.` )
                    .setColor(Colors.Blue)

                const collectorFilter = i => i.user.id === witch.player.id; // => witch id

                const collector = await channel.createMessageComponentCollector({
                    filter: collectorFilter,
                    time: 60_000
                });

                collector.on('collect', async i => {
                    collector.stop();
                    if (i.customId === 'okBtn') {
                        killPossion(i)
                    } else if (i.customId === 'nokBtn') {
                        const embed = new EmbedBuilder()
                            .setTitle('Sorcière')
                            .setDescription(`Vous n'utiliser pas de potion ce tour.`)
                            .setColor(Colors.Blue)

                        await i.update({embeds: [embed], components: []})
                        resolve()
                    }
                })
                if (witch.deathPotion) await i.update({embeds: [embed], components: [row]})
                else {
                    await i.update({embeds: [embed], components: []})
                    resolve()
                }
            }
        })
        await channel.send({embeds: [embed], components: [row]})

        const killPossion = async (i) => {
            const select = new StringSelectMenuBuilder()
                .setCustomId('witch')
                .setPlaceholder('Choisissez un joueur');
            playerList.forEach((user) => {
                if (user.player.id !== victim.player.id && user.player.id !== witch.player.id && !user.isDead)
                    select.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(user.player.displayName)
                            .setDescription('Voulez-vous tuer ce joueur ?')
                            .setValue(user.player.id)
                    )
            })

            const row = new ActionRowBuilder()
                .addComponents(select);

            const collectorFilter = i => i.user.id === witch.player.id; // => witch id

            const collector = channel.createMessageComponentCollector({collectorFilter, time: 60_000});

            collector.on('collect', async i => {
                collector.stop();

                const userSelected = await i.guild.members.fetch(i.values[0]);

                const embed = new EmbedBuilder()
                    .setTitle('Sorcière')
                    .setDescription(`Vous avez décidé de tué ${userSelected.displayName}.`)
                    .setColor(Colors.Blue)
                await i.update({embeds: [embed], components: []});
                const victimPoisson = playerList.find((user) => user.player.id === userSelected.id)
                victims.push(victimPoisson)
                witch.deathPotion = false
                resolve(true)
            })
            await i.update({embeds: [embed], components: [row]})
        }
    })

    // witch = playerlist with WITCH role

}
module.exports = witchTurn;

