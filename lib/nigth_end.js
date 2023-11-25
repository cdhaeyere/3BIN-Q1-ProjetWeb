const {EmbedBuilder} = require("@discordjs/builders");
const {StringSelectMenuBuilder, ActionRowBuilder} = require("discord.js");
const Kill_messages = require("./Kill_messages")

const night_end = async (playerList, deathList, couple, mainChannel) => {

    if (Array.isArray(couple) || couple.length > 0) {
        couple = couple.filter(a => !deathList.includes(a))
        if (couple.length < 2)
            deathList.push(...couple)
    }

    await voteCollector(deathList, playerList, mainChannel)

    deathList.forEach(dead => {
            playerList.forEach(alive => {
                if (dead.player.username === alive.player.username) {
                    alive.isDead = true
                }
            })
        }
    )

}

module.exports = night_end()

const voteCollector = (deathList,playerList, mainChannel) => {
    return new Promise(async (resolve) => {
        const dead = deathList.map(player => `☠ ${player.player.username} son role était ${player.role}\n`).join('')
        const embed = new EmbedBuilder()
            .setTitle('🌞 Le soleil se lève: sont morts ce soir:')
            .setDescription(dead)

        const options = playerList
            .filter(player => !deathList.includes(player) && !player.isDead )
            .map(player => ({ label: player.player.username, value: player.player.username }));

        const killVote = new StringSelectMenuBuilder()
            .setCustomId('Village')
            .setPlaceholder('Choisissez qui tuer')
            .addOptions(options)

        const voteRow = new ActionRowBuilder().addComponents(killVote);

        const msgVote = await mainChannel.send({ embeds :[embed], components: [voteRow]})

        let votes = playerList
            .filter(player => !deathList.includes(player) && !player.isDead )
            .map(player => ({ label: player.player.username, value: 0 }));

        let alreadyVoted = []

        const collector = mainChannel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Village'
                && playerList.find(u => u.player.username === i.user.username && u.isDead === false)
                && !alreadyVoted.includes(u => u.player.username),
            time: 180_000
        });

        collector.on('collect', async i =>{
            await i.update({embeds: [embed], components: [voteRow]});

            votes[votes.findIndex((player) => player.label === i.values[0])].value++
            alreadyVoted.push(i.user.username)

            if (alreadyVoted.length === options.length) {
                collector.stop();
            }
        })

        collector.on('end', async collected => {
            msgVote.delete()
            if (collected.size === 0) {
                await mainChannel.send(`la journée se fini sans mort`)
            } else {
                let maxVotes = Math.max(...votes.map(a => a.value));
                let mostVoted = votes.filter(a => a.value === maxVotes);
                const randomlySelected = mostVoted[Math.floor(Math.random() * mostVoted.length)];
                deathList.push(playerList.find(u => u.player.username === randomlySelected))
                let kill_message = Kill_messages[Math.floor(Math.random() * Kill_messages.length)]
                await mainChannel.send(`${randomlySelected} ${kill_message}`)
                resolve()
            }
        })
    })
}