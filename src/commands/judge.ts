import { EmbedFieldData, Message, MessageEmbed } from 'discord.js'

import { Context } from './utilities/context'
import { runCommand, sanitize } from './utilities/program'
import { addIndicator, dropIndicator } from './utilities/indicator'

import { getTestCases, Problem, problems } from '../problems'

import { RunInput, runProgram, RunResult, RunStatus } from '../execution'

import fs from 'fs/promises'
import path from 'path'

function passedTestCase(result: string, answer: string, digital: boolean) {
    const resultParts = result.trimRight().split('\n').map(x => x.trimRight())
    const answerParts = answer.trimRight().split('\n').map(x => x.trimRight())

    try {
        return (resultParts.length === answerParts.length) && !resultParts.some((x, i) => digital
            ? (parseFloat(x) !== parseFloat(answerParts[i])) : (x !== answerParts[i]))
    } catch {
        return false
    }
}

function makeCaseFields(totalTests: number, casesSucceeded: number) : EmbedFieldData[] {
    const fields = [ ]

    for (let a = 0; a < totalTests; a++) {
        fields.push({
            name: `Case ${a + 1}`,
            value: a > casesSucceeded
                ? '⚠ Skipped' : (a === casesSucceeded ? '🔴 Failed' : '✅ Success'),
            inline: true
        })
    }

    const maxCases = 20

    if (totalTests > maxCases) {
        const toRemove = totalTests - maxCases + 1

        if (casesSucceeded > toRemove) {
            // reduce success

            fields.splice((casesSucceeded - toRemove) / 2, toRemove, {
                name: '...',
                value: '✅ Success',
                inline: true
            })
        } else {
            // reduce skip

            fields.splice((totalTests - casesSucceeded - toRemove) / 2 + casesSucceeded, toRemove, {
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

        const tests = await getTestCases(problem)

        for (const test of tests) {
            const load = async (x: string) => test.file
                ? (await fs.readFile(path.resolve('data', problem.id!, x))).toString('utf8') : x

            const testInput = await load(test.input)
            const testOutput = await load(test.output)

            const run = await runProgram({
                language: input.language,
                source: input.source,
                input: `${testInput}\n\n\n`
            })

            if (run.status !== RunStatus.Success || !passedTestCase(run.result, testOutput, test.digital || false)) {
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
                ...makeCaseFields(tests.length, casesSucceeded),
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
            .setFooter(
                `Submitted by ${message.author.username}#${message.author.discriminator}.`,
                message.author.avatarURL() ?? undefined
            )
            
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
