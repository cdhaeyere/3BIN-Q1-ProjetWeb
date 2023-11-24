const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");

const joinChannel = (channel) => {
    return new Promise(async (resolve) => {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
        resolve(connection);
    });
};

const { join } = require('path');

const playSound = async (connection, sound) => {
    return new Promise(async (resolve) => {
        const player = createAudioPlayer();
        const resource = createAudioResource(join(__dirname, '../assets', sound));

        connection.subscribe(player);

        player.play(resource);
    
        player.on('idle', () => {
            resolve();
        });
    });
};

const leaveChannel = (connection) => {
    connection.destroy();
};

const Sounds = Object.freeze({
    EPIC: './epic.mp3',
});

module.exports = {
    joinChannel,
    playSound,
    leaveChannel,
    Sounds,
};