const { EmbedBuilder, Colors, ButtonBuilder, ActionRowBuilder, ChannelType, PermissionFlagsBits, ChannelSelectMenuBuilder, ButtonStyle } = require("discord.js");
const Roles = require("./Roles");

const setupChannels = async (interaction, channel, map) => {
    const embed = new EmbedBuilder()
        .setTitle("Setup Channels")
        .setDescription("Souhaitez-vous utiliser une catégorie existante ou en créer une nouvelle ?")
        .setColor(Colors.Blue)

    const create = new ButtonBuilder()
        .setCustomId("create")
        .setLabel("Créer")
        .setStyle(ButtonStyle.Primary)

    const use = new ButtonBuilder()
        .setCustomId("use")
        .setLabel("Utiliser")
        .setStyle(ButtonStyle.Secondary)

    const row = new ActionRowBuilder()
        .addComponents(create, use)

    const filter = (i) => i.user.id === interaction.user.id;

    const collector = channel.createMessageComponentCollector({ filter, time: 15000 });

    let category = null;
    collector.on("collect", async (i) => {
        collector.stop();
        if (i.customId === "create") {
            const embedCreate = new EmbedBuilder()
                .setTitle("Setup Channels")
                .setDescription("Création d'une nouvelle catégorie")
                .setColor(Colors.Blue)

            await i.update({ embeds: [embedCreate], components: [] });

            category = await interaction.guild.channels.create({
                name: "Loup-Garou", 
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: PermissionFlagsBits.VIEW_CHANNEL,
                    }
                ]
            });

            const result = await createChannels(interaction, category, map);

            if (result) {
                const embedSuccess = new EmbedBuilder()
                    .setTitle("Setup Channels")
                    .setDescription("Les channels ont bien été créés")
                    .setColor(Colors.Green)

                await i.followUp({ embeds: [embedSuccess], components: [] });
            } else {
                const embedError = new EmbedBuilder()
                    .setTitle("Setup Channels")
                    .setDescription("Une erreur est survenue lors de la création des channels")
                    .setColor(Colors.Red)

                await i.followUp({ embeds: [embedError], components: [] });
            }

            return result;
        } else if (i.customId === "use") {

            const embedUse = new EmbedBuilder()
                .setTitle("Setup Channels")
                .setDescription("Veuillez sélectionner la catégorie à utiliser")
                .setColor(Colors.Blue)

            const selectCategory = new ChannelSelectMenuBuilder()
                .setCustomId("selectCategory")
                .setPlaceholder("Sélectionner une catégorie")
                .addChannelTypes(ChannelType.GuildCategory)

            const rowUse = new ActionRowBuilder()
                .addComponents(selectCategory)

            const filterCategory = (i) => i.user.id === interaction.user.id;

            const collectorCategory = channel.createMessageComponentCollector({ filterCategory, time: 15000 });

            collectorCategory.on("collect", async (i) => {
                collectorCategory.stop();
                category = i.values[0];

                const result = await createChannels(interaction, category, map);

                if (result != []) {
                    const embedSuccess = new EmbedBuilder()
                        .setTitle("Setup Channels")
                        .setDescription("Les channels ont bien été créés")
                        .setColor(Colors.Green)

                    await i.update({ embeds: [embedSuccess], components: [] });
                } else {
                    const embedError = new EmbedBuilder()
                        .setTitle("Setup Channels")
                        .setDescription("Une erreur est survenue lors de la création des channels")
                        .setColor(Colors.Red)

                    await i.udapte({ embeds: [embedError], components: [] });
                }

                return result;
            });

            collectorCategory.on("end", async (collected) => {
                if (collected.size === 0) {
                    await interaction.followUp({ content: "Vous n'avez pas répondu à temps !" });
                }
            });

            await i.update({ embeds: [embedUse], components: [rowUse] });
        }
    });

    collector.on("end", async (collected) => {
        if (collected.size === 0) {
            await interaction.followUp({ content: "Vous n'avez pas répondu à temps !" });
        }
    });
    
    await interaction.followUp({ embeds: [embed], components: [row] })
}

const createChannels = async (interaction, category, map) => {
    const channels = [];

    const general = await interaction.guild.channels.create({
        name: "Général",
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
            {
                id: interaction.guild.roles.everyone.id,
                deny: PermissionFlagsBits.ViewChannel,
            }
        ]
    });

    map.forEach(async (data) => {
        const user = await interaction.guild.members.fetch(data.player.id);
        await general.permissionOverwrites.create(user, {
            ViewChannel: true,
        });
    });
       
    channels.push({ channel: general, role: null });

    const channelsToCreate = [];
    map.forEach((data) => {
        if (data.role !== Roles.VILLAGER && data.role !== Roles.HUNTER && channelsToCreate.indexOf(data.role) === -1) {
            channelsToCreate.push(data.role);
        }
    });

    channelsToCreate.forEach(async (role) => {
        const channel = await interaction.guild.channels.create({
            name: role,
            type: ChannelType.GuildText,
            parent: category,
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: PermissionFlagsBits.ViewChannel,
                }
            ]
        });

        const members = map.filter((data) => data.role === role);
        members.forEach(async (data) => {
            const user = await interaction.guild.members.fetch(data.player.id);
            await channel.permissionOverwrites.create(user, {
                ViewChannel: true,
            });
        });

        channels.push({ channel, role });
    });

    return channels;
};

module.exports = setupChannels;