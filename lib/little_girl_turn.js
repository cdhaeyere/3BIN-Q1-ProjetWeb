const { EmbedBuilder } = require("discord.js");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("@discordjs/builders")

const littleGirlTurn = (playerList, deathList, channelLittleGirl, userList) => {
    if (!Array.isArray(playerList) || !Array.isArray(deathList)) {
        return false;
    }
    if (deathList.length > playerList.length) {
        return false;
    }

    const embedLittleGirl = new EmbedBuilder()
    .setTitle('Player Selection')
    .setDescription('Please choose 2 different player, if one of them is a wolf, we will tell you')

    const alivePlayerList = [];
    for (let i = 0; i < userList.length; i++) {
        if (deathList.find(userList[i].id) === undefined) {
            alivePlayerList.push(userList[i]);
        }
    }

    const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('users')
    .addOptions(alivePlayerList.map((user) => {
        return new StringSelectMenuOptionBuilder()
        .setLabel(user.displayName)
        .setValue(user.id)
    }));

    const row = new ActionRowBuilder()
                .addComponents(select);

    channelLittleGirl.send({embeds: [embedLittleGirl], components: [row]});

    // récup réponse select vie collector(cf doc)
    // check si 1 des deux choisis a role == loup
    // renvoyer gg ou nique en fonstion de si loup ou pas
} 

module.exports = littleGirlTurn;