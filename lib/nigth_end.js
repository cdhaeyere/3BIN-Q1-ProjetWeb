const {EmbedBuilder} = require("@discordjs/builders");
const {StringSelectMenuBuilder, ActionRowBuilder, Colors} = require("discord.js");
const Kill_messages = require("./Kill_messages")
const Roles = require("./Roles");
const hunterTurn = require("./hunter_turn");

const night_end = (playerList, deathList, couple, mainChannel) => {
    return new Promise(async resolve => {
        let dead;
        if (deathList.length === 0) {
            dead = 'Personne 😄';
        } else {
            dead = deathList.map(player => `☠ ${player.player.displayName} son role était ${player.role}\n`).join('');
        }

        const embed = new EmbedBuilder()
            .setTitle('🌞 Le soleil se lève: sont morts ce soir:')
            .setDescription(dead);

        await mainChannel.send({embeds: [embed]});

        deathList = await checkHunterAndCouple(mainChannel, couple, playerList, deathList);

        const loupGarouCount = playerList.filter(player => player.role === Roles.WEREWOLF && deathList.find(p => p.player.id === player.player.id) === undefined).length;
        const alivePlayers = playerList.filter(player => !player.isDead && player.role !== Roles.WEREWOLF && deathList.find(p => p.player.id === player.player.id) === undefined).length;
        if (loupGarouCount !== 0) {
            if (loupGarouCount <= (alivePlayers) / 2) {
                deathList = await voteCollector(deathList, playerList, mainChannel, couple);
            }
        }

        deathList.forEach(dead => {
            playerList.forEach(alive => {
                if (dead.player.id === alive.player.id) {
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
            .filter(player => !deathList.includes(player) && !player.isDead)
            .map(player => ({ label: player.player.displayName, value: player.player.displayName }));

        const killVote = new StringSelectMenuBuilder()
            .setCustomId('Village')
            .setPlaceholder('Choisissez qui tuer')
            .addOptions(options);

        const voteRow = new ActionRowBuilder().addComponents(killVote);

        const msgVote = await mainChannel.send({ embeds :[embed], components: [voteRow]});

        let votes = playerList
            .filter(player => !deathList.includes(player) && !player.isDead)
            .map(player => ({ label: player.player.displayName, value: 0 }));

        let alreadyVoted = [];

        const collector = mainChannel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Village'
                && playerList.find(u => u.player.id === i.user.id && u.isDead === false)
                && !alreadyVoted.includes(i.user.id)
                && !deathList.find(p => p.player.id === i.user.id),
            time: 180_000
        });

        let voteDisplay = [];
        collector.on('collect', async i => {
            voteDisplay.push(`${i.user.displayName} à voté pour ${i.values[0]}`);

            const embed = new EmbedBuilder()
                .setTitle('Vote du jour')
                .setDescription(`Qui est un loup selon-vous ?\n\n${voteDisplay.join('\n')}`);

            await i.update({ embeds: [embed], components: [voteRow] });

            votes[votes.findIndex((player) => player.label === i.values[0])].value++;
            alreadyVoted.push(i.user.id);

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

                const playerVoted = playerList.find(u => u.player.displayName === randomlySelected.label);

                deathList.push(playerVoted);

                const voteCheck = await checkHunterAndCouple(mainChannel, couple, playerList, [playerVoted]);

                deathList = deathList.concat(voteCheck);

                let kill_message = Kill_messages[Math.floor(Math.random() * Kill_messages.length)];
                await mainChannel.send(`${randomlySelected.label} ${kill_message}`);

                resolve(deathList);
            }
        });
    });
}

const checkCouple = async (couple, deathList, mainChannel) => {
    if (couple.length > 0) {
        const collateralDamage = couple.filter(a => !deathList.includes(a));
        if (collateralDamage.length === 1) {

            const embed = new EmbedBuilder()
                .setTitle('Couple')
                .setDescription(`${collateralDamage[0].player.displayName} était en couple avec ${couple.find(p => p !== collateralDamage[0]).player.displayName}`);

            await mainChannel.send({ embeds: [embed]} );
            deathList.push(collateralDamage[0]);

            return deathList;
        }
    }

    return undefined;
}

const checkHunter = async (playerList, deathList, mainChannel) => {
    const hunter = deathList.find(p => p.role === Roles.HUNTER);
    if (hunter) {
        const killed = await hunterTurn(mainChannel, hunter.player, playerList, deathList);
        if (killed)
            deathList.push(killed);

        return deathList;
    }

    return undefined;
}

const checkHunterAndCouple = async (mainChannel, couple, playerList, deathList) => {
    const checkCoupleResult = await checkCouple(couple, deathList, mainChannel);

    if (checkCoupleResult) {
        const checkHunterResult = await checkHunter(playerList, checkCoupleResult, mainChannel);

        if (checkHunterResult) {
            deathList = checkHunterResult;
        } else {
            deathList = checkCoupleResult;
        }
    } else {
        const checkHunterResult = await checkHunter(playerList, deathList, mainChannel);

        if (checkHunterResult) {
            const checkCoupleResult2 = await checkCouple(couple, checkHunterResult, mainChannel);
            if (checkCoupleResult2) {
                deathList = checkCoupleResult2;
            } else {
                deathList = checkHunterResult;
            }
        }
    }

    return deathList;
}

module.exports = night_end;
