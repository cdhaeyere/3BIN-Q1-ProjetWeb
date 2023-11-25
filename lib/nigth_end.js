const {EmbedBuilder} = require("@discordjs/builders");
const {StringSelectMenuBuilder, ActionRowBuilder, Colors} = require("discord.js");
const Kill_messages = require("./Kill_messages")
const Roles = require("./Roles");
const hunterTurn = require("./hunter_turn");

const night_end = (playerList, deathList, couple, mainChannel) => {
    return new Promise(async resolve => {
        const dead = deathList.map(player => `☠ ${player.player.username} son role était ${player.role}\n`).join('');
        const embed = new EmbedBuilder()
            .setTitle('🌞 Le soleil se lève: sont morts ce soir:')
            .setDescription(dead);

        await mainChannel.send({embeds: [embed]});

        if (await checkCouple(couple, deathList, mainChannel)) {
            await checkHunter(playerList, deathList, mainChannel);
        } else if (await checkHunter(playerList, deathList, mainChannel)) {
            await checkCouple(couple, deathList, mainChannel)
        }

        const loupGarouCount = playerList.filter(player => player.role === 'Loup-Garou').length;
        const alivePlayers = playerList.filter(player => player.isDead === false).length;
        if (loupGarouCount <= (alivePlayers - deathList.length) / 2) {
            await voteCollector(deathList, playerList, mainChannel, couple);
        }

        deathList.forEach(dead => {
            playerList.forEach(alive => {
                if (dead.player.username === alive.player.username) {
                    alive.isDead = true;
                }
            });
        });

        resolve();
    });
}

const voteCollector = (deathList, playerList, mainChannel, couple) => {
    return new Promise(async (resolve) => {
        const embed = new EmbedBuilder()
            .setTitle('Vote du jour')
            .setDescription('Qui est un loup selon-vous ?');

        const options = playerList
            .filter(player => !deathList.includes(player) && !player.isDead )
            .map(player => ({ label: player.player.username, value: player.player.username }));

        const killVote = new StringSelectMenuBuilder()
            .setCustomId('Village')
            .setPlaceholder('Choisissez qui tuer')
            .addOptions(options);

        const voteRow = new ActionRowBuilder().addComponents(killVote);

        const msgVote = await mainChannel.send({ embeds :[embed], components: [voteRow]});

        let votes = playerList
            .filter(player => !deathList.includes(player) && !player.isDead)
            .map(player => ({ label: player.player.username, value: 0 }));

        let alreadyVoted = [];

        const collector = mainChannel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Village'
                && playerList.find(u => u.player.username === i.user.username && u.isDead === false)
                && !alreadyVoted.includes(i.user.username)
                && !deathList.find(p => p.player.username === i.user.username),
            time: 180_000
        });

        collector.on('collect', async i => {
            votes[votes.findIndex((player) => player.label === i.values[0])].value++;
            alreadyVoted.push(i.user.username);

            if (alreadyVoted.length === options.length) {
                collector.stop();
            }
        });

        collector.on('end', async collected => {
            msgVote.delete();

            if (collected.size === 0) {
                await mainChannel.send(`la journée se fini sans mort`);
            } else {
                let maxVotes = Math.max(...votes.map(a => a.value));
                let mostVoted = votes.filter(a => a.value === maxVotes);
                const randomlySelected = mostVoted[Math.floor(Math.random() * mostVoted.length)];

                const playerVoted = playerList.find(u => u.player.username === randomlySelected.label);

                if (await checkCouple(couple, [playerVoted], mainChannel)) {
                    await checkHunter(playerList, [playerVoted], mainChannel);
                } else if (await checkHunter(playerList, [playerVoted], mainChannel)) {
                    await checkCouple(couple, [playerVoted], mainChannel)
                }

                deathList.push(playerList.find(u => u.player.username === randomlySelected.label));

                let kill_message = Kill_messages[Math.floor(Math.random() * Kill_messages.length)];
                await mainChannel.send(`${randomlySelected.label} ${kill_message}`);

                resolve();
            }
        });
    });
}

const checkCouple = async (couple, deathList, mainChannel) => {
    if (couple.length > 0) {
        const collateralDamage = couple.filter(a => !deathList.includes(a));
        if (collateralDamage.length < 2) {
            const embed = new EmbedBuilder()
                .setTitle('Couple')
                .setDescription(`${collateralDamage[0].player.username} était en couple avec ${couple.find(p => p !== collateralDamage[0]).player.username}`);


            await mainChannel.send({ embeds: [embed]} );
            deathList.push(collateralDamage[0]);

            return true;
        }
    }

    return false;
}

const checkHunter = async (playerList, deathList, mainChannel) => {
    const hunter = deathList.find(p => p.role === Roles.HUNTER);
    if (hunter) {
        const killed = await hunterTurn(mainChannel, hunter.player, playerList, deathList);
        deathList.push(killed);

        return true;
    }

    return false;
}

module.exports = night_end;
