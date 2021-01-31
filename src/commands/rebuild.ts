import { Context } from './context'

import { rebuildAllImages } from '../execution'

export default async ({ message }: Context) => {
    if (!message.member || !message.member.hasPermission('ADMINISTRATOR')) {
        await message.channel.send('Only an administrator can use this command.')
        return
    }

    await rebuildAllImages()

    await message.channel.send('Rebuilt all containers.')
}
