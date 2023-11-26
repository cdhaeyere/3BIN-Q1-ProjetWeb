const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const Roles = require("./Roles");

const hunterTurn = (mainChannel, hunter, playerList, deathList) => {
    return new Promise(async (resolve) => {
        const embed = new EmbedBuilder()
            .setTitle(Roles.HUNTER)
            .setDescription("Vous êtes le chasseur, vous pouvez tuer une personne avant de mourir.")
            .setFooter({
                "text": "Vous avez 30 secondes pour choisir.",
            });

        const alivePlayerList = playerList.filter(player => !player.isDead && player.role !== Roles.HUNTER && deathList.find(p => p.player.id === player.player.id) === undefined);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('hunter')
            .addOptions(alivePlayerList.map((user) => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(user.player.displayName)
                    .setValue(user.player.id)
            }));

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        const msg = await mainChannel.send({content: `<@${hunter.id}>`, embeds: [embed], components: [row]});

        const collector = mainChannel.createMessageComponentCollector({
            filter: i => i.customId === 'hunter' && hunter.id === i.user.id,
            time: 30_000
        });

        collector.on('collect', async i => {
            collector.stop();

            const player = playerList.find(p => p.player.id === i.values[0]);

            const embedRep = new EmbedBuilder()
                .setTitle(Roles.HUNTER)
                .setTitle("Le chasseur a tué " + player.player.displayName)
                .setDescription("Son role était " + player.role);

            await i.update({embeds: [embedRep], components: []});

            resolve(player);
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                msg.delete();

                const embed = new EmbedBuilder()
                    .setTitle(Roles.HUNTER)
                    .setTitle("Le chasseur n'a tué personne.");

                await mainChannel.send({embeds: [embed]});

                resolve();
            }
        });
    });
}
    
module.exports = hunterTurn;