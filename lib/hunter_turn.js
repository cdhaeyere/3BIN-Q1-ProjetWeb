const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const Roles = require("./Roles");

const hunterTurn = (mainChannel, hunter, playerList) => {
    return new Promise((resolve) => {
        const embed = new EmbedBuilder()
        .setTitle(Roles.HUNTER)
        .setDescription("Vous êtes le chasseur, vous pouvez tuer une personne avant de mourir.")
        .setFooter({
            "text": "Vous avez 30 secondes pour choisir.",
        });

        const alivePlayerList = [];
        for (let i = 0; i < playerList.length; i++) {
            if (!playerList[i].isDead && playerList[i].player.id !== hunter.id) {
                alivePlayerList.push(playerList[i]);
            }
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('hunter')
            .addOptions(alivePlayerList.map((user) => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(user.player.displayName)
                    .setValue(user.player.id)
            }))
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        const msg = mainChannel.send({content: `<@${hunter.id}>`, embeds: [embed], components: [row]});

        const collector = mainChannel.createMessageComponentCollector({
            filter: i => i.customId === 'hunter' && hunter.id === i.user.id,
            time: 30_000
        });

        collector.on('collect', async i => {
            collector.stop();

            const player = playerList.find(p => p.player.id === i.values[0]);

            const embedRep = new EmbedBuilder()
                .setTitle(Roles.HUNTER)
                .setTitle("Le chasseur a tué " + player.player.displayName);

            resolve(player.player);

            await i.update({embeds: [embedRep], components: []});
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                msg.delete();

                const embed = new EmbedBuilder()
                    .setTitle(Roles.HUNTER)
                    .setTitle("Le chasseur n'a tué personne.");

                resolve();

                await mainChannel.send({embeds: [embed]});
            }
        });
    });
}
    
module.exports = hunterTurn;