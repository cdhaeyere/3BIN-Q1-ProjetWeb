const Roles = require("./Roles");
const { EmbedBuilder } = require("discord.js");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("@discordjs/builders")

const littleGirlTurn = async (channelLittleGirl, userList) => {
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
    
    const idLittleGirl = userList.filter(e => e.role === Roles.LITTLE_GIRL)[0].player.id;
    const filterCollector = i => i.customId === 'littleGirl' && i.user.id === idLittleGirl;

    const collector = channelLittleGirl.createMessageComponentCollector({ filterCollector, time: 30000 });

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

        await i.update({ embeds: [embedRep], components: []})
    })

    await channelLittleGirl.send({ embeds: [embedLittleGirl], components: [row] });

}

module.exports = littleGirlTurn;