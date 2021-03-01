import { MessageEmbed } from 'discord.js'

import { Context } from './utilities/context'
import { addIndicator, dropIndicator } from './utilities/indicator'

import { problems, reloadProblems } from '../problems'

export default async ({ message }: Context) => {
    if (!message.member || !message.member.hasPermission('ADMINISTRATOR')) {
        await message.channel.send('Only an administrator can use this command.')
        return
    }

    await addIndicator(message)

    await reloadProblems()

    const description = problems
        .map(x => ` ✅   ${x.name} (<#${x.channel}>)`)
        .join('\n')

    const embed = new MessageEmbed()
        .setColor('DARK_AQUA')
        .setTitle('Rebuilt Images')
        .setDescription(description)

    await dropIndicator(message)

    await message.channel.send(embed)
}
