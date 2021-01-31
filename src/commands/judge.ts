import { Message, MessageEmbed } from 'discord.js'

import { Context } from './context'

import { runCommand, sanitize } from './program'

import { Problem, problems } from '../problems'

import { RunInput, runProgram, RunResult, RunStatus } from '../execution'

async function execute(message: Message, input: RunInput, problem: Problem) {
    if (input.input.length) {
        await message.channel.send('Cannot specify input for a judge command.')
        return
    }

    const loadingId = '805489619268272138'
    const loadingIcon = message.client.emojis.cache.get(loadingId)

    await message.react(loadingIcon)

    let casesSucceeded = 0

    let result: RunResult

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
                    name: `Case ${casesSucceeded + 1} Problem`,
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
                        name: `Case ${casesSucceeded + 1} Output`,
                        value: `\`\`\`\n${sanitize(result.result, 10)}\n\`\`\``
                    }
                ] : [])
            ])
        ])

    const botId = message.client.user.id
    await message.reactions.cache.get(loadingId)?.users.remove(botId)

    await message.channel.send(embed)
}

export default async (context: Context) => {
    const problem = problems.find(x => x.channel === context.message.channel.id)

    if (!problem) {
        await context.message.channel.send('No problem in this channel.')

        return
    }

    const run = (message: Message, input: RunInput) => execute(message, input, problem)

    await runCommand(context, run)
}
