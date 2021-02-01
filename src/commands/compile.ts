import { Message, MessageEmbed } from 'discord.js'

import { sanitize, runCommand } from './program'

import { Context } from './context'

import { RunInput, runProgram, RunStatus } from '../execution'

async function execute(message: Message, input: RunInput) {
    try {
        const loadingId = '805489619268272138'
        const loadingIcon = message.client.emojis.cache.get(loadingId)

        await message.react(loadingIcon)

        const result = await runProgram(input)

        const embed = new MessageEmbed()
            .setColor(result.status === RunStatus.Success ? 'DARK_GREEN' : 'DARK_RED')
            .setTitle((() => {
                switch (result.status) {
                    case RunStatus.Success:
                        return 'Success'
                    case RunStatus.Error:
                        return 'Error'
                    case RunStatus.Timeout:
                        return 'Timeout'
                    case RunStatus.InternalError:
                        return 'Internal Error'
                }
            })())
            .setDescription(result.result.length ?
                `\`\`\`\n${sanitize(result.result, 1500)}\n\`\`\`` : 'Program exited.')

        const botId = message.client.user.id
        await message.reactions.cache.get(loadingId)?.users.remove(botId)

        await message.channel.send(embed)
    } catch (e) {
        const embed = new MessageEmbed()
            .setColor('DARK_RED')
            .setTitle('Aborted.')

        await message.channel.send(embed)
    }
}

export default async (context: Context) => {
    await runCommand(context, execute)
}