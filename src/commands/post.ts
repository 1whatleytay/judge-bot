import { MessageEmbed, TextChannel } from 'discord.js'

import { Context } from './context'

import { Problem, problems } from '../problems'

export default async ({ message, remainder }: Context) => {
    if (!message.member || !message.member.hasPermission('ADMINISTRATOR')) {
        await message.channel.send('Only an administrator can use this command.')
        return
    }

    const match = remainder.match(/<#(?<id>\d+)>/)

    if (!match) {
        await message.channel.send('Can\'t find channel id.')
        return
    }

    const id = match.groups.id
    const problem = problems.find(x => x.channel === id) as Problem

    if (!problem) {
        await message.channel.send('No problem for this channel.')
        return
    }

    const channel = (await message.client.channels.fetch(id)) as TextChannel

    if (!channel) {
        await message.channel.send('Can\'t find channel id.')
        return
    }

    const embed = new MessageEmbed()
        .setColor('DARK_AQUA')
        .setTitle(`${problem.name} - Problem`)
        .setDescription(problem.description.general)
        .addFields([
            { name: 'Input Specification', value: problem.description.input },
            { name: 'Output Specification', value: problem.description.output }
        ])

    for (let index = 0; index < problem.description.samples.length; index++) {
        const sample = problem.description.samples[index]

        embed.addField(`Sample Input #${index + 1}`, `\`\`\`\n${sample.input}\n\`\`\``)
        embed.addField(`Sample Output #${index + 1}`, `\`\`\`\n${sample.output}\n\`\`\``)
    }

    await channel.send(embed)
}