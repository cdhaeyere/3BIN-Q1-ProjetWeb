const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const Roles = require("../lib/Roles");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('init')
        .setDescription('Initializes a werewolf game'),
    async execute(interaction) {
        let playerCount;
        let werewolfCount = 0;

        await replyInitialEmbed(interaction);

        const playerCollector = interaction.channel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Joueurs' && i.user.id === interaction.user.id
        });

        playerCollector.on('collect', async i => {
            playerCollector.stop();

            playerCount = parseInt(i.values[0]);
            const werewolfSelectCount = Math.floor(playerCount / 2);

            let embed, row;
            if (werewolfSelectCount === 0) {
                ({ responseEmbed: embed, responseRow: row } = roleEmbed(playerCount, werewolfCount));
            } else if (werewolfSelectCount === 1) {
                werewolfCount = 1;
                ({ responseEmbed: embed, responseRow: row } = roleEmbed(playerCount, werewolfCount));
            } else {
                ({ responseEmbed: embed, responseRow: row } = werewolfEmbed(playerCount, werewolfSelectCount));
            }

            await i.reply({ embeds: [embed], components: [row], ephemeral: true });
        });

        const werewolfCollector = interaction.channel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Werewolf' && i.user.id === interaction.user.id
        });

        werewolfCollector.on('collect', async i => {
            werewolfCollector.stop();

            werewolfCount = parseInt(i.values[0]);

            const { responseEmbed, responseRow } = roleEmbed(playerCount, werewolfCount);

            await i.reply({ embeds: [responseEmbed], components: [responseRow], ephemeral: true });
        });

        const roleCollector = interaction.channel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Roles' && i.user.id === interaction.user.id
        });

        roleCollector.on('collect', async i => {
            roleCollector.stop();

            await i.deferReply();

            const roles = i.values.map(role => Roles[role]);

            const responseEmbed = new EmbedBuilder()
                .setTitle(`Nouveau jeu Loup-Garou de ${playerCount} joueurs`)
                .setDescription('Réagissez au message si vous voulez jouer à ce Loup-Garou');

            const responseMessage = await i.followUp({ embeds: [responseEmbed] });

            const reactionCollector = responseMessage.createReactionCollector({ dispose: true });

            let players= [];
            reactionCollector.on('collect', (reaction, user) => {
                if (!players.find(u => u.id === user.id)) {
                    console.log(`${user.username} joined the game`)
                    players.push(user);
                }

                if (players.length === playerCount) {
                    reactionCollector.stop();

                    const villagersToAdd = playerCount - werewolfCount - roles.length;

                    for (let i = 0; i < villagersToAdd; i ++) {
                        roles.push('Villageois');
                    }

                    const playerRoleArray = setupRole(players, roles);
                }
            });

            reactionCollector.on('remove', (reaction, user) => {
                const index = players.findIndex(u => u.id === user.id);
                if (index !== -1) {
                    players.splice(index, 1);
                    console.log(`${user.username} left the game`);
                }
            });
        });
    }
};

async function replyInitialEmbed(interaction) {
    const initialEmbed = new EmbedBuilder()
        .setTitle('Créer votre jeu Loup-Garou')
        .setDescription('Ici j\'explique au user comment faire');

    const options = Array.from({ length: 10 }, (_, index) => ({
        label: `${index + 1}`,
        value: `${index + 1}`,
    }));

    const playerSelect = new StringSelectMenuBuilder()
        .setCustomId('Joueurs')
        .setPlaceholder('Nombre de joueurs')
        .addOptions(options);

    const initialRow = new ActionRowBuilder().addComponents(playerSelect);

    await interaction.reply({ embeds: [initialEmbed], components: [initialRow], ephemeral: true });
}

function werewolfEmbed(playerCount, werewolfSelectCount) {
    const responseEmbed = new EmbedBuilder()
        .setTitle(`Vous avez choisi ${playerCount} joueurs`)
        .setDescription('Combien de loups voulez-vous ?');

    const options = Array.from({ length: werewolfSelectCount }, (_, index) => ({
        label: `${index + 1}`,
        value: `${index + 1}`,
    }));

    const werewolfSelect = new StringSelectMenuBuilder()
        .setCustomId('Werewolf')
        .setPlaceholder('Nombre de loups')
        .addOptions(options);

    const responseRow = new ActionRowBuilder().addComponents(werewolfSelect);

    return { responseEmbed, responseRow };
}

function roleEmbed(playerCount, werewolfCount) {
    const responseEmbed = new EmbedBuilder()
        .setTitle(`Vous avez choisi ${playerCount} joueurs`)
        .setDescription('Quels rôles voulez-vous jouer ?');

    let roleOptions = Object.keys(Roles).map((roleKey) => ({
        label: Roles[roleKey],
        value: roleKey,
    }));

    roleOptions = roleOptions.filter(role => role.value !== 'WEREWOLF');

    const roleSelect = new StringSelectMenuBuilder()
        .setCustomId('Roles')
        .setPlaceholder('Roles')
        .setMinValues(1)
        .setMaxValues(playerCount - werewolfCount)
        .addOptions(roleOptions);

    const responseRow = new ActionRowBuilder().addComponents(roleSelect);

    return { responseEmbed, responseRow };
}