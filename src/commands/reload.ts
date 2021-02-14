import { MessageEmbed } from 'discord.js'

import { Context } from './utilities/context'
import { addIndicator, dropIndicator } from './utilities/indicator'

import { problems, reloadProblems, verify } from '../problems'

export default async ({ message }: Context) => {
    if (!message.member || !message.member.hasPermission('ADMINISTRATOR')) {
        await message.channel.send('Only an administrator can use this command.')
        return
    }

    await addIndicator(message)

    await reloadProblems()

    const problemDetails = await Promise.all(
        problems.map(async problem => ({ problem, okay: await verify(problem) })))

    const description = problemDetails
        .map(x => ` ${x.okay ? '✅' : '🔴'} ${x.problem.name} (<#${x.problem.channel}>)`)
        .join('\n')

    const embed = new MessageEmbed()
        .setColor('DARK_AQUA')
        .setTitle('Rebuilt Images')
        .setDescription(description)

    await dropIndicator(message)

    await message.channel.send(embed)
}
