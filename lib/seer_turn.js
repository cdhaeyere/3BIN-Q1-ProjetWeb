const { StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder } = require("@discordjs/builders");
const { Colors } = require("discord.js");

const seerTurn = async (channel, map) => {
    const embed = new EmbedBuilder()
        .setTitle('Voyante')
        .setDescription('C\'est à vous de jouer !')
        .setColor(Colors.Blue)
        .setThumbnail("https://cdn.discordapp.com/attachments/1173733046231502858/1173734050595360778/werewolf-mascot-logo-esport-template_142989-522-349949783.jpg?ex=65650804&is=65529304&hm=3fb852c4e39d867a670dcd29e4d261d222a2e0a87d4fc93b89bc1a8c5f2c6e87&");

    const playerUsernames = [];
    await channel.guild.members.fetch().then(members => {
        members.forEach(member => {
            map.forEach(player => {
                if (member.id === player.player) {
                    playerUsernames.push(member.user.username);
                }
            })
        })
    });

    const select = new StringSelectMenuBuilder()
        .setCustomId('seer')
        .setPlaceholder('Choisissez un joueur')
        .addOptions(playerUsernames.map((username) => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(username)
                .setValue(username)
                .setDescription('Voulez-vous voir le rôle de ce joueur ?')
        }));

    const row = new ActionRowBuilder()
        .addComponents(select);

    const filter = i => i.customId === 'seer' && i.user.id === interaction.user.id;

    const collector = channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('end', async i => {
        collector.stop();
        const userSelected = i.values[0];

        const idUser = await interaction.guild.members.fetch().then(members => {
            let id = "";
            members.forEach(member => {
                if (member.user.username === userSelected) {
                    id = member.id;
                }
            })
            return id;
        });

        for (const player of map) {
            if (player.player === idUser) {
                const embed = new EmbedBuilder()
                    .setTitle('Voyante')
                    .setDescription(`Le joueur ${userSelected} est ${player.role}.`)
                    .setColor(Colors.Blue)
                    .setThumbnail("https://cdn.discordapp.com/attachments/1173733046231502858/1173734050595360778/werewolf-mascot-logo-esport-template_142989-522-349949783.jpg?ex=65650804&is=65529304&hm=3fb852c4e39d867a670dcd29e4d261d222a2e0a87d4fc93b89bc1a8c5f2c6e87&");
                await i.update({ embeds: [embed], components: [] });
            }
        }
    });

    await channel.send({ embeds: [embed], components: [row] });
}

module.exports = seerTurn;