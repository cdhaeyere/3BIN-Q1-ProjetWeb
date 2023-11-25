const { SlashCommandBuilder } = require('discord.js');
const { joinChannel, playSound, Sounds, leaveChannel } = require('../lib/sound');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Reloads a command.'),
    async execute(interaction) {
        const connection = await joinChannel(interaction.member.voice.channel);

        await interaction.reply('Playing sound...');

        await playSound(connection, Sounds.WITCH);

        await interaction.followUp('Sound played!');

        leaveChannel(connection);
    },
};
