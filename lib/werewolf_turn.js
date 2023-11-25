const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const Roles = require("./Roles");

async function werewolfTurn(players, deads, werewolfChannel) {
    const werewolfEmbed = new EmbedBuilder()
        .setTitle('Loup-Garou')
        .setDescription('Votez une personne que vous souhaitez éliminer');

    const options = players
        .filter(player => !player.isDead && player.role !== Roles.WEREWOLF)
        .map(player => ({ label: player.player.username, value: player.player.username }));

    const killSelect = new StringSelectMenuBuilder()
        .setCustomId('Werewolves')
        .setPlaceholder('Qui voulez vous tuer ce soir ?')
        .addOptions(options)

    const row = new ActionRowBuilder().addComponents(killSelect);

    await werewolfChannel.send({ embeds: [werewolfEmbed], components: [row] });

    let votes = [];
    const nbWerewolves = players.reduce((count, player) => {
        if (player.role === 'Loup-Garou') {
            return count + 1;
        }
        return count;
    }, 0);
    const collector = werewolfChannel.createMessageComponentCollector({
        filter: i => i.isStringSelectMenu() && i.customId === 'Werewolves'
            && !votes.find(p => p.player === i.user)
            && players.find(p => p.player.username === i.user.username && p.role === Roles.WEREWOLF && p.isDead === false)
    });

    collector.on('collect', async i => {
        werewolfChannel.send(`${i.user.username} à voté pour ${i.values}`);

        votes.push({player: i.user.username, vote: i.values});

        if (votes.length === nbWerewolves) {
            collector.stop();

            const voteTally = votes.reduce((tally, { vote: votedFor }) => {
                tally[votedFor] = (tally[votedFor] || 0) + 1;
                return tally;
            }, {});

            const maxVotes = Math.max(...Object.values(voteTally));
            const mostVotedPersons = Object.keys(voteTally).filter(person => voteTally[person] === maxVotes);
            const randomlySelectedPerson = mostVotedPersons[Math.floor(Math.random() * mostVotedPersons.length)];

            werewolfChannel.send(`Vous avez tué ${randomlySelectedPerson} avec ${maxVotes} votes`);

            deads.push(players.find(u => u.player.username === randomlySelectedPerson));
        }
    });
}