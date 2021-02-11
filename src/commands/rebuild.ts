import { MessageEmbed } from 'discord.js'

import { Context } from './utilities/context'
import { addIndicator, dropIndicator } from './utilities/indicator'

import { rebuildAllImages } from '../execution'
import { Language, properties } from '../execution/languages'

export default async ({ message }: Context) => {
    if (!message.member || !message.member.hasPermission('ADMINISTRATOR')) {
        await message.channel.send('Only an administrator can use this command.')
        return
    }

    await addIndicator(message)
    const succeeded = await rebuildAllImages()

    const description = (Object.keys(properties) as Language[])
        .map(x => `${succeeded.includes(x) ? '✅' : '🔴'} ${properties[x].commonName}`)
        .join('\n\n')

    const embed = new MessageEmbed()
        .setColor('DARK_AQUA')
        .setTitle('Rebuilt Images')
        .setDescription(description)

    await dropIndicator(message)

    await message.channel.send(embed)
}
