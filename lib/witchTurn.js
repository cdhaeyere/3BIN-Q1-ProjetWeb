const {
    ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder, Colors
} = require('discord.js');
const Roles = require("./Roles");

const witchTurn = async (victims, channel, witch, playerList) => {
    return new Promise(async (resolve) => {

        if ((!witch.lifePotion && !witch.deathPotion) || witch.isDead) {
            resolve();
        }

        const victim = victims[0];

        const embed = new EmbedBuilder()
            .setTitle('Sorcière')
            .setDescription(witch.lifePotion ? `Voulez vous sauver ${victim.player.displayName} ?` : 'Voulez vous utiliser votre potion de poison')
            .setColor(Colors.Blue)
            .setFooter({
                "text": "Vous avez 30 secondes pour choisir.",
            });

        const okBtn = new ButtonBuilder()
            .setCustomId("okBtn")
            .setLabel("Oui")
            .setStyle(ButtonStyle.Success);

        const nokBtn = new ButtonBuilder()
            .setCustomId("nokBtn")
            .setLabel("Non")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(okBtn, nokBtn);

        const msg = await channel.send({content: `<@${witch.player.id}>`, embeds: [embed], components: [row]});

        const collector = await channel.createMessageComponentCollector({
            filter: i => i.user.id === witch.player.id,
            time: 30_000
        });

        collector.on('collect', async i => {
            collector.stop();

            if (i.customId === 'okBtn') {
                if (!witch.lifePotion) {
                    await killPotion(i);
                } else {
                    witch.lifePotion = false;

                    const embed = new EmbedBuilder()
                        .setTitle('Sorcière')
                        .setDescription(`Le joueur ${victim.player.displayName} est sain et sauf.`)
                        .setColor(Colors.Blue);

                    victims.pop();

                    await i.update({embeds: [embed], components: []});
                    resolve();
                }
            } else if (i.customId === 'nokBtn') {
                if (!witch.lifePotion) {
                    const embed = new EmbedBuilder()
                        .setTitle('Sorcière')
                        .setDescription(`Vous n'utilisez pas de potion ce tour.`)
                        .setColor(Colors.Blue);

                    await i.update({embeds: [embed], components: []});
                    return  resolve();
                }

                const embed = new EmbedBuilder()
                    .setTitle('Sorcière')
                    .setDescription(witch.deathPotion ? `Le joueur ${victim.player.displayName} n'est pas sauvé. Voulez vous tuer un autre joueur?` : `Le joueur ${victim.player.displayName} n'est pas sauvé.`)
                    .setColor(Colors.Blue);

                if (witch.deathPotion) {
                    await i.update({embeds: [embed], components: [row]})
                } else {
                    await i.update({embeds: [embed], components: []});
                    resolve();
                }

                const collect = await channel.createMessageComponentCollector({
                    filter: i => i.user.id === witch.player.id,
                    time: 30_000
                });

                collect.on('collect', async i => {
                    collect.stop();

                    if (i.customId === 'okBtn') {
                        await killPotion(i);
                    } else if (i.customId === 'nokBtn') {
                        const embed = new EmbedBuilder()
                            .setTitle('Sorcière')
                            .setDescription(`Vous n'utilisez pas de potion ce tour.`)
                            .setColor(Colors.Blue);

                        await i.update({embeds: [embed], components: []});

                        resolve();
                    }
                });

                collect.on('end', async collected => {
                    if (collected.size === 0) {
                        msg.delete();

                        const embed = new EmbedBuilder()
                            .setTitle(Roles.LITTLE_GIRL)
                            .setDescription('Vous n\'avez pas répondu a temps, vous passez votre tour.');

                        await channel.send({embeds: [embed], components: []});

                        resolve();
                    }
                });
            }
        })

        collector.on('end', async collected => {
            if (collected.size === 0) {
                msg.delete();

                const embed = new EmbedBuilder()
                    .setTitle(Roles.LITTLE_GIRL)
                    .setDescription('Vous n\'avez pas répondu a temps, vous passez votre tour.');

                await channel.send({embeds: [embed], components: []});

                resolve();
            }
        });

        const killPotion = async (i) => {
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
                    );
            });

            const row = new ActionRowBuilder().addComponents(select);

            await i.update({embeds: [embed], components: [row]});

            const collector = channel.createMessageComponentCollector({
                filter : i => i.user.id === witch.player.id,
                time: 30_000
            });

            collector.on('collect', async i => {
                collector.stop();

                witch.deathPotion = false;

                const userSelected = await i.guild.members.fetch(i.values[0]);

                const embed = new EmbedBuilder()
                    .setTitle('Sorcière')
                    .setDescription(`Vous avez décidé de tuer ${userSelected.displayName}.`)
                    .setColor(Colors.Blue);

                await i.update({embeds: [embed], components: []});

                const victimPoison = playerList.find((user) => user.player.id === userSelected.id);
                victims.push(victimPoison);

                resolve();
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    msg.delete();

                    const embed = new EmbedBuilder()
                        .setTitle(Roles.LITTLE_GIRL)
                        .setDescription('Vous n\'avez pas répondu a temps, vous passez votre tour.');

                    await channel.send({embeds: [embed], components: []});

                    resolve();
                }
            });
        }
    });
}
module.exports = witchTurn;
