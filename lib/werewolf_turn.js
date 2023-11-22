const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const Roles = require("./Roles");

async function werewolfTurn(players, deads) {
    const werewolfEmbed = new EmbedBuilder()
        .setTitle('Loup-Garou')
        .setDescription('Ici j\'explique au user comment faire');

    const options = players
        .filter(player => !player.isDead && player.role !== Roles.WEREWOLF)
        .map(player => ({ label: player.player.username, value: player.player.username }));

    const killSelect = new StringSelectMenuBuilder()
        .setCustomId('Werewolves')
        .setPlaceholder('Qui voulez vous tuer ce soir ?')
        .addOptions(options)

    const row = new ActionRowBuilder().addComponents(killSelect);

    // TODO send embed in the right channel
    //  await interaction.reply({ embeds: [werewolfEmbed], components: [row] });

    let votes = [];
    const nbWerewolves = players.reduce((count, player) => {
        if (player.role === 'Loup-Garou') {
            return count + 1;
        }
        return count;
    }, 0);
    const collector = interaction.channel.createMessageComponentCollector({
        filter: i => i.isStringSelectMenu() && i.customId === 'Werewolves'
            && !votes.find(u => u.player === i.user)
            && players.find(u => u.player.username === i.user.username && u.role === Roles.WEREWOLF && u.isDead === false)
    });

    collector.on('collect', async i => {
        console.log(`${i.user.username} à voté pour ${i.values}`);

        votes.push({player: i.user.username, vote: i.values});

        if (votes.length === nbWerewolves) {
            collector.stop();
            console.log("Everyone voted");

            const voteTally = votes.reduce((tally, { vote: votedFor }) => {
                tally[votedFor] = (tally[votedFor] || 0) + 1;
                return tally;
            }, {});

            const maxVotes = Math.max(...Object.values(voteTally));
            const mostVotedPersons = Object.keys(voteTally).filter(person => voteTally[person] === maxVotes);
            const randomlySelectedPerson = mostVotedPersons[Math.floor(Math.random() * mostVotedPersons.length)];

            console.log('Max voted person:', randomlySelectedPerson, 'with', maxVotes, 'votes');

            deads.push(players.find(u => u.player.username === randomlySelectedPerson));
            console.log(deads);
        }
    });
}