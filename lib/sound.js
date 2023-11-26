const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");
const { join } = require('path');
const fs = require('node:fs');

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
    return new Promise(async (resolve) => {
        connection.destroy();
        resolve();
    });
};

const getRandomDeathSound = () => {
    const deathsPath = join(__dirname, '../assets/deaths');
    const deathFiles = fs.readdirSync(deathsPath).filter(file => file.endsWith('.mp3'));

    const randomIndex = Math.floor(Math.random() * deathFiles.length);
    const randomDeath = deathFiles[randomIndex];

    console.log(`[INFO] Random death sound: ${randomDeath}`);
    return join('deaths', randomDeath);
};

const playRandomDeathSound = async (connection) => {
    return new Promise(async (resolve) => {
        const player = createAudioPlayer();
        const resource = createAudioResource(join(__dirname, '../assets', getRandomDeathSound()));

        connection.subscribe(player);

        player.play(resource);
    
        player.on('idle', () => {
            resolve();
        });
    });
};

const Sounds = {
    CUPID: './roles/cupid.mp3',
    GIRL: './roles/girl.mp3',
    HUNTER: './roles/hunter.mp3',
    MORNING: './roles/morning.mp3',
    NIGHT: './roles/night.mp3',
    SEER: './roles/seer.mp3',
    THIEF: './roles/thief.mp3',
    WITCH: './roles/witch.mp3',
    WOLVES: './roles/wolves.mp3',
};

module.exports = {
    joinChannel,
    playSound,
    leaveChannel,
    Sounds,
    playRandomDeathSound,
};