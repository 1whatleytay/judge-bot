import { EmbedFieldData, Message, MessageEmbed } from 'discord.js'

import { Context } from './utilities/context'
import { runCommand, sanitize } from './utilities/program'
import { addIndicator, dropIndicator } from './utilities/indicator'

import { Problem, problems, TestCase } from '../problems'

import { RunInput, runProgram, RunResult, RunStatus } from '../execution'

import fs from 'fs/promises'
import path from 'path'

function passedTestCase(result: string, answer: string) {
    const resultParts = result.trimRight().split('\n').map(x => x.trimRight())
    const answerParts = answer.trimRight().split('\n').map(x => x.trimRight())

    return (resultParts.length === answerParts.length)
        && !resultParts.some((x, i) => x !== answerParts[i])
}

function makeCaseFields(tests: TestCase[], casesSucceeded: number) : EmbedFieldData[] {
    const fields = tests.map((_, index) => ({
        name: `Case ${index + 1}`,
        value: index > casesSucceeded
            ? '⚠ Skipped' : (index === casesSucceeded ? '🔴 Failed' : '✅ Success'),
        inline: true
    }))

    const maxCases = 20

    if (tests.length > maxCases) {
        const toRemove = tests.length - maxCases + 1

        if (casesSucceeded > toRemove) {
            // reduce success

            fields.splice((casesSucceeded - toRemove) / 2, toRemove, {
                name: '...',
                value: '✅ Success',
                inline: true
            })
        } else {
            // reduce skip

            fields.splice((tests.length - casesSucceeded - toRemove) / 2 + casesSucceeded, toRemove, {
                name: '...',
                value: '⚠ Skipped',
                inline: true
            })
        }
    }

    return fields
}

async function execute(message: Message, input: RunInput, problem: Problem) {
    try {
        if (input.input.length) {
            await message.channel.send('Cannot specify input for a judge command.')
            return
        }

        await addIndicator(message)

        let casesSucceeded = 0

        let failureResult: RunResult | null = null

        for (const test of problem.tests) {
            const load = async (x: string) => test.file
                ? (await fs.readFile(path.resolve('data', x))).toString('utf8') : x

            const testInput = await load(test.input)
            const testOutput = await load(test.output)

            const run = await runProgram({
                language: input.language,
                source: input.source,
                input: `${testInput}\n\n\n`
            })

            if (run.status !== RunStatus.Success || !passedTestCase(run.result, testOutput)) {
                failureResult = run
                break
            }

            casesSucceeded++
        }

        // I'm sorry about addFields :/
        const embed = new MessageEmbed()
            .setColor(failureResult ? 'DARK_RED' : 'DARK_GREEN')
            .setTitle(`${problem.name} - Submission ${failureResult ? 'Failed' : 'Success'}`)
            .addFields([
                ...makeCaseFields(problem.tests, casesSucceeded),
                ...(failureResult ? [
                    {
                        name: `Case ${casesSucceeded + 1} Problem`,
                        value: `${(() => {
                            switch (failureResult.status) {
                                case RunStatus.Success:
                                    return '🔴 Wrong Answer'
                                case RunStatus.Error:
                                    return '❌ Error'
                                case RunStatus.Timeout:
                                    return '⏰ Timeout'
                                case RunStatus.InternalError:
                                    return '🔨 Internal Error'
                            }
                        })()}`
                    },

                    ...(failureResult.result.length ? [
                        {
                            name: `Case ${casesSucceeded + 1} Output`,
                            value: `\`\`\`\n${sanitize(failureResult.result, 1000)}\n\`\`\``
                        }
                    ] : [])
                ] : [])
            ])
            
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
    const problem = problems.find(x => x.channel === context.message.channel.id)

    if (!problem) {
        await context.message.channel.send('No problem in this channel.')

        return
    }

    const run = (message: Message, input: RunInput) => execute(message, input, problem)

    await runCommand(context, run)
}
