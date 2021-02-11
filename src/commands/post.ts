import { MessageEmbed, TextChannel } from 'discord.js'

import { Context } from './utilities/context'

import { Problem, problems } from '../problems'

export default async ({ message, remainder }: Context) => {
    if (!message.member || !message.member.hasPermission('ADMINISTRATOR')) {
        await message.channel.send('Only an administrator can use this command.')
        return
    }

    const missingChannel = 'Can\'t find channel.'

    const match = remainder.match(/<#(?<id>\d+)>/)
    if (!match) {
        return message.channel.send(missingChannel)
    }

    const id = match.groups?.id
    if (!id) {
        return message.channel.send(missingChannel)
    }

    const problem = problems.find(x => x.channel === id) as Problem
    if (!problem) {
        return message.channel.send('No problem for this channel.')
    }

    const channel = (await message.client.channels.fetch(id)) as TextChannel
    if (!channel) {
        return message.channel.send(missingChannel)
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

        const explanationPostfix = sample.explanation ? `\n${sample.explanation}` : ''

        embed.addField(`Sample Input #${index + 1}`, `\`\`\`\n${sample.input}\n\`\`\``)
        embed.addField(`Sample Output #${index + 1}`, `\`\`\`\n${sample.output}\n\`\`\`${explanationPostfix}`)
    }

    await channel.send(embed)
}