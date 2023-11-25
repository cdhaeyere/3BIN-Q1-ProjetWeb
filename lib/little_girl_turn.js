const Roles = require("./Roles");
const { EmbedBuilder } = require("discord.js");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("@discordjs/builders")

const littleGirlTurn = (channelLittleGirl, userList) => {
    return new Promise(async resolve => {
        if (!Array.isArray(userList)) {
            return false;
        }

        const embedLittleGirl = new EmbedBuilder()
            .setTitle('Choix de joueur')
            .setDescription("choisissez deux joueurs, si l'un d'eux est un loup, nous vous le dirons")

        const alivePlayerList = [];
        for (let i = 0; i < userList.length; i++) {
            if (!userList[i].isDead) {
                alivePlayerList.push(userList[i]);
            }
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('littleGirl')
            .addOptions(alivePlayerList.map((user) => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(user.player.displayName)
                    .setValue(user.player.id)
            }))
            .setMinValues(2)
            .setMaxValues(2);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        const littleGirlId = userList.find(p => p.role === Roles.LITTLE_GIRL).player.id;

        await channelLittleGirl.send({content: `<@${littleGirlId}>`, embeds: [embedLittleGirl], components: [row]});

        const collector = channelLittleGirl.createMessageComponentCollector({
            filter: i => i.customId === 'littleGirl' && userList.find(p => p.role === Roles.LITTLE_GIRL && p.player.id === i.user.id),
            time: 30000
        });

        let isLoup = false;
        collector.on('collect', async i => {
            collector.stop();

            alivePlayerList.forEach(user => {
                if (user.player.id === i.values[0] || user.player.id === i.values[1]) {
                    if (user.role === Roles.WEREWOLF) {
                        isLoup = true;
                    }
                }
            });

            const embedRep = new EmbedBuilder()
                .setTitle(isLoup ? "L'un des joueur est un loup" : "Il n'y a pas de loup ici");

            resolve();

            await i.update({embeds: [embedRep], components: []});
        });
    });
}

module.exports = littleGirlTurn;