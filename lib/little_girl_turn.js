const { Roles } = require("./Roles");

const { EmbedBuilder } = require("discord.js");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("@discordjs/builders")

const littleGirlTurn = (channelLittleGirl, userList) => {
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
                .addComponents(select);

    channelLittleGirl.send({embeds: [embedLittleGirl], components: [row]});

    // récup réponse select vie collector(cf doc)
    const filter = i => i.customId === 'littleGirl' && i.user.id === userList.filter(e => e.role === Roles.LITTLE_GIRL).id;

    const collector = channelLittleGirl.createMessageComponentCollector({ filter, time: 30000 });

    // check si 1 des deux choisis a role == loup
    const isLoup = false;
    alivePlayerList.array.forEach(user => {
        if (user.player.id === collector.values[0] || user.player.id === collector.values[1]) {
            if (user.role === Roles.WEREWOLF) {
                isLoup = true;
            }
        }
    });
    
    // renvoyer gg ou nique en fonstion de si loup ou pas
    if (isLoup) {
        const embedLittleGirl = new EmbedBuilder()
                .setTitle('L\'un des joueur est un loup')
    } else {
        const embedLittleGirl = new EmbedBuilder()
                .setTitle('Il n\'y a pas de loup ici')
    }
} 

module.exports = littleGirlTurn;