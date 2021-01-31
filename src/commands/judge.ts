import { MessageEmbed, PartialTextBasedChannelFields } from 'discord.js'

import { Context } from './context'

import { RunInput, runProgram, RunResult, RunStatus } from '../execution'

import { runCommand } from './program'

import { Problem, problems } from '../problems'

async function execute(channel: PartialTextBasedChannelFields, input: RunInput, problem: Problem) {
    if (input.input.length) {
        await channel.send('Cannot specify input for a judge command.')
        return
    }

    let casesSucceeded = 0

    let result: RunResult

    const zeroWidth = '`\u200b`\u200b`'

    for (const test of problem.tests) {
        result = await runProgram({
            language: input.language,
            source: input.source,
            input: test.input
        })

        if (result.status !== RunStatus.Success || result.result.trim() !== test.output.trim()) {
            break
        }

        casesSucceeded++
    }

    const succeeded = problem.tests.length === casesSucceeded

    // I'm sorry about addFields :/
    const embed = new MessageEmbed()
        .setColor(succeeded ? 'DARK_GREEN' : 'DARK_RED')
        .setTitle(`${problem.name} - Submission ${succeeded ? 'Success' : 'Failed'}`)
        .addFields([
            ...problem.tests.map((test, index) => ({
                name: `Case ${index + 1}`,
                value: index > casesSucceeded
                    ? '⚠ Skipped' : (index === casesSucceeded ? '🔴 Failed' : '✅ Success'),
                inline: true
            })),
            ...(succeeded ? [] : [
                {
                    name: `Case #${casesSucceeded} Problem`,
                    value: `${(() => {
                        switch (result.status) {
                            case RunStatus.Success: return '🔴 Wrong Answer'
                            case RunStatus.Error: return '⚠ Error'
                            case RunStatus.Timeout: return '⏰ Timeout'
                            case RunStatus.InternalError: return '🔨 Internal Error'
                        }
                    })()}`
                },

                ...(result.result.length ? [
                    {
                        name: `Case #${casesSucceeded} Output`,
                        value: `\`\`\`\n${result.result.replace('```', zeroWidth)}\n\`\`\``
                    }
                ] : [])
            ])
        ])

    await channel.send(embed)
}

export default async (context: Context) => {
    const problem = problems.find(x => x.channel === context.message.channel.id)

    if (!problem) {
        await context.message.channel.send('No problem in this channel.')

        return
    }

    const run = (channel: PartialTextBasedChannelFields, input: RunInput) => execute(channel, input, problem)

    await runCommand(context, run)
}
