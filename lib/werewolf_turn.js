const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, Colors} = require("discord.js");
const Roles = require("./Roles");

const werewolfTurn = (players, deads, werewolfChannel) => {
    return new Promise(async resolve => {
        const werewolfEmbed = new EmbedBuilder()
            .setTitle(Roles.WEREWOLF)
            .setDescription('Votez une personne que vous souhaitez éliminer')
            .setColor(Colors.Blue)
            .setFooter({
                "text": "Vous avez 60 secondes pour voter.",
            });

        const options = players
            .filter(p => !p.isDead && p.role !== Roles.WEREWOLF)
            .map(player => ({label: player.player.displayName, value: player.player.displayName}));

        const killSelect = new StringSelectMenuBuilder()
            .setCustomId('Werewolves')
            .setPlaceholder('Qui voulez vous tuer ce soir ?')
            .addOptions(options)

        const row = new ActionRowBuilder().addComponents(killSelect);

        const werewolvesMention = players.filter(p => p.role === Roles.WEREWOLF).map(p => `<@${p.player.id}>`).join(' ');

        const msg = await werewolfChannel.send({content: werewolvesMention, embeds: [werewolfEmbed], components: [row]});

        const nbWerewolves = players.reduce((count, player) => {
            if (player.role === Roles.WEREWOLF) {
                return count + 1;
            }
            return count;
        }, 0);

        const collector = werewolfChannel.createMessageComponentCollector({
            filter: i => i.isStringSelectMenu() && i.customId === 'Werewolves'
                && !voted.find(p => p === i.user)
                && players.find(p => p.player.id === i.user.id && p.role === Roles.WEREWOLF && p.isDead === false),
            time: 60_000
        });

        let voted = [];
        let votes = [];
        let voteDisplay = [];
        collector.on('collect', async i => {
            const vote = i.values[0];

            voteDisplay.push(`${i.user.displayName} à voté pour ${vote}`);

            const voteEmbed = new EmbedBuilder()
                .setTitle(Roles.WEREWOLF)
                .setColor(Colors.Blue)
                .setDescription(`Votez une personne que vous souhaitez éliminer\n\n${voteDisplay.join('\n')}`);

            await i.update({embeds: [voteEmbed], components: [row]});

            voted.push(i.user);

            if (!votes.find(v => v.vote === vote))
                votes.push({vote: vote, nbVotes: 1});
            else
                votes.find(v => v.vote === vote).nbVotes++;

            if (voted.length === nbWerewolves)
                collector.stop();
        });

        collector.on('end', async collected => {
            msg.delete();

            if (collected.size === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle(Roles.WEREWOLF)
                    .setColor(Colors.Red)
                    .setDescription('Vous avez voté pour personne.');

                await werewolfChannel.send({ embeds: [errorEmbed], components: [] });

                resolve([]);
            } else {
                let maxVotes = Math.max(...votes.map(obj => obj.nbVotes));
                let mostVoted = votes.filter(obj => obj.nbVotes === maxVotes);
                const randomlySelected = mostVoted[Math.floor(Math.random() * mostVoted.length)];

                const killEmbed = new EmbedBuilder()
                    .setTitle(Roles.WEREWOLF)
                    .setColor(Colors.Blue)
                    .setDescription(`Vous avez tué ${randomlySelected.vote} avec ${maxVotes} votes`);

                await werewolfChannel.send({ embeds: [killEmbed] });

                deads.push(players.find(u => u.player.displayName === randomlySelected.vote));

                resolve(deads);
            }
        });
    });
}

module.exports = werewolfTurn;

