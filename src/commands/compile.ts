import { MessageEmbed, PartialTextBasedChannelFields } from 'discord.js'

import { runCommand } from './program'

import { Context } from './context'

import { RunInput, runProgram, RunStatus } from '../execution'

async function execute(channel: PartialTextBasedChannelFields, input: RunInput) {
    const result = await runProgram(input)

    const zeroWidth = '`\u200b`\u200b`'

    const embed = new MessageEmbed()
        .setColor(result.status === RunStatus.Success ? 'DARK_GREEN' : 'DARK_RED')
        .setTitle((() => {
            switch (result.status) {
                case RunStatus.Success: return 'Success'
                case RunStatus.Error: return 'Error'
                case RunStatus.Timeout: return 'Timeout'
                case RunStatus.InternalError: return 'Internal Error'
            }
        })())
        .setDescription(result.result.length ?
            `\`\`\`\n${result.result.replace('```', zeroWidth)}\n\`\`\`` : 'Program exited.')

    await channel.send(embed)
}

export default async (context: Context) => {
    await runCommand(context, execute)
}