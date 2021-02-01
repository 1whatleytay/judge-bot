import { Message, MessageEmbed } from 'discord.js'

import { sanitize, runCommand } from './utilities/program'

import { Context } from './utilities/context'
import { addIndicator, dropIndicator } from './utilities/indicator'

import { RunInput, runProgram, RunStatus } from '../execution'

async function execute(message: Message, input: RunInput) {
    try {
        await addIndicator(message)

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

        await dropIndicator(message)

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