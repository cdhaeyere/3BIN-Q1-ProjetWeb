const { StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder } = require("@discordjs/builders");
const { Colors } = require("discord.js");
const Roles = require("./Roles");

const seerTurn = async (interaction, channelSeer, map) => {
    return new Promise(async (resolve) => {
        const seer = map.find(player => player.role === Roles.SEER);
        if (!seer) {
            const error = new EmbedBuilder()
                .setTitle('Erreur')
                .setDescription('La de voyante est morte !')
                .setColor(Colors.Red);

            await interaction.followUp({ embeds: [error] });

            resolve();
        }

        const embed = new EmbedBuilder()
            .setTitle(Roles.SEER)
            .setDescription('C\'est à vous de jouer !')
            .setFooter({
                "text": "Vous avez 30 secondes pour choisir un joueur.",
            })
            .setColor(Colors.Blue)
            .setThumbnail("https://cdn.discordapp.com/attachments/1061254672532394034/1176618065400705174/wp5900938-493399953.jpg?ex=656f85f7&is=655d10f7&hm=95e47b1cc5a6ea208aa9b4d6a278a7bea46f2a18944e3564d67b7cc8403d2870&");

        const users = [];
        for (const data of map) {
            if (!data.isDead && data.role !== Roles.SEER) {
                users.push(data.player);
            }
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('seer')
            .setPlaceholder('Choisissez un joueur')
            .addOptions(users.map((player) => {
                return new StringSelectMenuOptionBuilder()
                    .setLabel(player.username)
                    .setValue(player.id)
                    .setDescription('Voulez-vous voir le rôle de ce joueur ?')
            }));

        const row = new ActionRowBuilder()
            .addComponents(select);

        const msg = await channelSeer.send({ content: `<@${seer.player.id}>`, embeds: [embed], components: [row] });

        const collector = channelSeer.createMessageComponentCollector({
            filter: i=> i.customId === 'seer' && i.user.id === seer.player.id,
            time: 30_000
        });

        collector.on('collect', async i => {
            collector.stop();
            const selected = map.find(player => player.player.id === i.values[0]);

            const embed = new EmbedBuilder()
                .setTitle(Roles.SEER)
                .setDescription(`Le joueur ${selected.player.username} est ${selected.role}.`)
                .setColor(Colors.Blue)
                .setThumbnail("https://cdn.discordapp.com/attachments/1061254672532394034/1176618065400705174/wp5900938-493399953.jpg?ex=656f85f7&is=655d10f7&hm=95e47b1cc5a6ea208aa9b4d6a278a7bea46f2a18944e3564d67b7cc8403d2870&");

            await i.update({ embeds: [embed], components: [] });
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                msg.delete();

                const embed = new EmbedBuilder()
                    .setTitle(Roles.SEER)
                    .setDescription('Vous n\'avez pas choisi de joueur, vous passez votre tour.')
                    .setColor(Colors.Blue)
                    .setThumbnail("https://cdn.discordapp.com/attachments/1061254672532394034/1176618065400705174/wp5900938-493399953.jpg?ex=656f85f7&is=655d10f7&hm=95e47b1cc5a6ea208aa9b4d6a278a7bea46f2a18944e3564d67b7cc8403d2870&");

                await channelSeer.send({ embeds: [embed], components: [] });

                resolve();
            }
        });
    });
}

module.exports = seerTurn;