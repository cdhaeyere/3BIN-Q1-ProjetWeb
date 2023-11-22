const {
    ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder, Colors
} = require('discord.js');

const witchTurn = async (victim, channel, witch, playerList) => {

    // witch = playerlist with WITCH role
    let dead = []

    const embed = new EmbedBuilder()
        .setTitle('Sorcière')
        .setDescription(`Voulez vous sauvé ${victim.player.displayName} ?`)
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

            const embed = new EmbedBuilder()
                .setTitle('Sorcière')
                .setDescription(`Le joueur ${victim.player.displayName} est sain et sauf.`)
                .setColor(Colors.Blue)
            await i.update({embeds: [embed], components: []})

        } else if (i.customId === 'nokBtn') {

            // killFunc
            const embed = new EmbedBuilder()
                .setTitle('Sorcière')
                .setDescription(`Le joueur ${victim.player.displayName} n'est pas sauver. Voulez vous tuer un autre joueur?`)
                .setColor(Colors.Blue)

            const collectorFilter = i => i.user.id === witch.player.id; // => witch id

            const collector = await channel.createMessageComponentCollector({filter: collectorFilter, time: 60_000});

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
                }
            })
            await i.update({embeds: [embed], components: [row]})
            dead.push(victim)
        }
    })
    await channel.send({embeds: [embed], components: [row]})

    const killPossion = async (i) => {

        const select = new StringSelectMenuBuilder()
            .setCustomId('witch')
            .setPlaceholder('Choisissez un joueur');
        playerList.forEach((user) => {
            if (user.player.id !== victim.player.id)
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
            dead.push(victimPoisson)
            console.log(dead) //todo return
        })
        await i.update({embeds: [embed], components: [row]})

    }



}
module.exports = witchTurn;

