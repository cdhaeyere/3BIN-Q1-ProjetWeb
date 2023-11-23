const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const Roles = require("../lib/Roles");
const setupRole = require("../lib/setup_role");
const { setupChannels, deleteChannels } = require("../lib/setup_channels");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('Starts a werewolf game'),
    async execute(interaction) {
        const { players, channels } = await init(interaction);

        //TODO Preparation tour

        //TODO Normal tour

        //TODO Delete channels
        await deleteChannels(channels);
    }
};

/**
 * Asks for the player count, werewolf count, and roles
 * collects réactions to get players
 * once game is full, shuffles the players and roles
 * @param interaction The discord interaction
 * @returns {Promise<unknown>} A list of discord User associated with their role
 */
async function init(interaction) {
    return new Promise(async (resolve) => {
        await playercountEmbed(interaction);

        const playerCount = await playerCountCollector(interaction);

        const werewolfCount = await werewolfCountCollector(interaction, playerCount);

        const players = await gameRoleCollector(interaction, playerCount, werewolfCount);
        console.log(players)

        const channels = await setupChannels(interaction, players);

        resolve({ players, channels });
    });
}

/**
 * Sends an embed asking for the player count
 * @param interaction The discord interaction
 * @returns {Promise<void>}
 */
async function playercountEmbed(interaction) {
    const initialEmbed = new EmbedBuilder()
        .setTitle('Créer votre jeu Loup-Garou')
        .setDescription('Ici j\'explique au user comment faire');

    const options = Array.from({ length: 6 }, (_, index) => ({
        label: `${index + 2}`,
        value: `${index + 2}`,
    }));

    const playerSelect = new StringSelectMenuBuilder()
        .setCustomId('Joueurs')
        .setPlaceholder('Nombre de joueurs')
        .addOptions(options);

    const initialRow = new ActionRowBuilder().addComponents(playerSelect);

    await interaction.reply({ embeds: [initialEmbed], components: [initialRow], ephemeral: true });
}

/**
 * Attaches a collector to the player count embed
 * on collect stops the collector, gets the player count and sends the werewolf embed
 * @param interaction The discord interaction
 * @returns {Promise<number>} A promise that resolves with the player count when the interaction is processed.
 */
function playerCountCollector(interaction) {
    return new Promise(async (resolve) => {
        let playerCount;

        const playerCollector = interaction.channel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Joueurs' && i.user.id === interaction.user.id
        });

        playerCollector.on('collect', async i => {
            playerCollector.stop();

            playerCount = parseInt(i.values[0]);

            const { responseEmbed, responseRow } = werewolfEmbed(playerCount);

            await i.reply({ embeds: [responseEmbed], components: [responseRow], ephemeral: true });

            resolve(playerCount);
        });
    });
}

/**
 * Attaches a collector to the werewolf count embed
 * on collect stops the collector, gets the werewolf count and sends the role embed
 * @param interaction The discord interaction
 * @param playerCount chosen player count
 * @returns {Promise<number>} A promise that resolves with the werewolf count when the interaction is processed.
 */
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

/**
 * Attaches a collector to the role embed
 * on collect stops the collector and gets the roles
 * then it sends a message collecting reactions.
 * once game is full, shuffles the players and roles
 * @param interaction The discord interaction
 * @param playerCount chosen player count
 * @param werewolfCount chosen werewolf count
 * @returns {Promise<[{User, Roles}]>} A promise that resolves with the player-role array when the interaction is processed.
 */
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
                .setDescription('Ici j\'explique');

            const join = new ButtonBuilder()
                .setCustomId("join")
                .setLabel("Rejoindre")
                .setStyle(ButtonStyle.Success)

            const leave = new ButtonBuilder()
                .setCustomId("leave")
                .setLabel("Quitter")
                .setStyle(ButtonStyle.Danger)

            const row = new ActionRowBuilder().addComponents(join, leave);

            const responseMessage = await i.followUp({ embeds: [responseEmbed], components: [row] });

            let players= [];
            const collector = responseMessage.createMessageComponentCollector();

            collector.on('collect', i => {
                if (i.customId === "join" && !players.find(u => u === i.user)) {
                    players.push(i.user);
                    console.log(`${i.user.username} joined the game`);
                } else if (i.customId === "leave" && players.find(u => u === i.user)) {
                    const index = players.findIndex(u => u === i.user);
                    if (index !== -1) {
                        players.splice(index, 1);
                        console.log(`${i.user.username} left the game`);
                    }
                }

                if (players.length === playerCount)
                    collector.stop();
            });

            collector.on('end', () => {
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

/**
 * Creates an embed asking for the werewolf count
 * @param playerCount chosen player count
 * @returns {{responseRow: ActionRowBuilder<AnyComponentBuilder>, responseEmbed: EmbedBuilder}} the row and embed to be sent
 */
function werewolfEmbed(playerCount) {
    const responseEmbed = new EmbedBuilder()
        .setTitle(`Vous avez choisi ${playerCount} joueurs`)
        .setDescription('Combien de loups voulez-vous ?');

    const werewolfSelectCount = Math.floor(playerCount / 2);

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

/**
 * Creates an embed asking for the roles the game master would like to play
 * @param playerCount chosen player count
 * @param werewolfCount chosen werewolf count
 * @returns {{responseRow: ActionRowBuilder<AnyComponentBuilder>, responseEmbed: EmbedBuilder}} the row and embed to be sent
 */
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