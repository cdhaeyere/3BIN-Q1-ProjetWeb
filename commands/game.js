const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const Roles = require("../lib/Roles");
const setupRole = require("../lib/setup_role");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Starts a werewolf game'),
    async execute(interaction) {
        const playerRoleArray = await init(interaction);

        console.log(playerRoleArray);
    }
};

async function init(interaction) {
    return new Promise(async (resolve) => {
        await replyInitialEmbed(interaction);

        const playerCount = await playerCountCollector(interaction);

        const werewolfCount = await werewolfCountCollector(interaction, playerCount);

        const players = await gameRoleCollector(interaction, playerCount, werewolfCount);

        resolve(players);
    });
}

async function replyInitialEmbed(interaction) {
    const initialEmbed = new EmbedBuilder()
        .setTitle('Créer votre jeu Loup-Garou')
        .setDescription('Ici j\'explique au user comment faire');

    const options = Array.from({ length: 6 }, (_, index) => ({
        label: `${index + 5}`,
        value: `${index + 5}`,
    }));

    const playerSelect = new StringSelectMenuBuilder()
        .setCustomId('Joueurs')
        .setPlaceholder('Nombre de joueurs')
        .addOptions(options);

    const initialRow = new ActionRowBuilder().addComponents(playerSelect);

    await interaction.reply({ embeds: [initialEmbed], components: [initialRow], ephemeral: true });
}

function playerCountCollector(interaction) {
    return new Promise(async (resolve) => {
        let playerCount;

        const playerCollector = interaction.channel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Joueurs' && i.user.id === interaction.user.id
        });

        playerCollector.on('collect', async i => {
            playerCollector.stop();

            playerCount = parseInt(i.values[0]);

            const werewolfSelectCount = Math.floor(playerCount / 2);

            const { responseEmbed, responseRow } = werewolfEmbed(playerCount, werewolfSelectCount);

            await i.reply({ embeds: [responseEmbed], components: [responseRow], ephemeral: true });

            resolve(playerCount);
        });
    });
}

function werewolfCountCollector(interaction, playerCount) {
    return new Promise(async (resolve) => {
        let werewolfCount;

        const werewolfCollector = interaction.channel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Werewolf' && i.user.id === interaction.user.id
        });

        werewolfCollector.on('collect', async i => {
            werewolfCollector.stop();

            werewolfCount = parseInt(i.values[0]);

            const { responseEmbed, responseRow } = roleEmbed(playerCount, werewolfCount);

            await i.reply({ embeds: [responseEmbed], components: [responseRow], ephemeral: true });

            resolve(werewolfCount);
        });
    });
}

function gameRoleCollector(interaction, playerCount, werewolfCount) {
    return new Promise(async (resolve) => {
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
                }
            });

            reactionCollector.on('remove', (reaction, user) => {
                const index = players.findIndex(u => u.id === user.id);
                if (index !== -1) {
                    players.splice(index, 1);
                    console.log(`${user.username} left the game`);
                }
            });

            reactionCollector.on('end', () => {
                console.log('Game can start');

                const villagersToAdd = playerCount - werewolfCount - roles.length;

                for (let i = 0; i < villagersToAdd; i ++) {
                    roles.push(Roles.VILLAGER);
                }

                for (let i = 0; i < werewolfCount; i ++) {
                    roles.push(Roles.WEREWOLF);
                }

                resolve(setupRole(players, roles));
            });
        });
    });
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