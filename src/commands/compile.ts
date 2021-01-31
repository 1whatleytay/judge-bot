import { Message, MessageEmbed, MessageReaction, PartialTextBasedChannelFields } from 'discord.js'

import { Context } from './context'
import { Callbacks } from './callbacks'

import { RunInput, runProgram, RunStatus } from '../execution'
import { Language, properties, toLanguage } from '../execution/languages'

class Source {
    source: string
    language: string
}

function parseSource(content: string): Source[] {
    const regex = /```(?<language>\w+)?\n(?<source>(.|\s)*?)\n```/g

    let results: Source[] = [ ]

    let result
    while (result = regex.exec(content)) {
        results.push({
            source: result.groups.source,
            language: result.groups.language
        })
    }

    return results
}

function extractProgram(content: string): RunInput {
    const source = parseSource(content)

    if (!source.length || source.length > 2 || (source.length === 2 && source[1].language)) {
        return null
    }

    return {
        source: source[0].source,
        input: source.length === 2 ? source[1].source : '',
        language: toLanguage(source[0].language)
    }
}

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

async function grabLanguage(message: Message, callbacks: Callbacks, source?: string, input?: string) {
    const description = Object.values(properties).map(x => `${x.emoji} ${x.commonName}`).join('\n')

    const embed = new MessageEmbed()
        .setColor('DARK_AQUA')
        .setTitle('Pick a compilation language.')
        .setDescription(description)

    const prompt = await message.channel.send(embed)

    const success = (reaction: MessageReaction) => {
        const languages = Object.keys(properties) as Language[]
        const language = languages.find(x => properties[x].emoji === reaction.emoji.name)

        if (language) {
            callbacks.dropReaction(prompt.id)

            if (source) {
                return execute(message.channel, {source, input, language})
            } else {
                return grabProgram(message, callbacks, language)
            }
        }
    }

    for (const x of Object.values(properties)) {
        await prompt.react(x.emoji)
    }

    callbacks.addReaction(prompt.id, success, () => prompt.react('❌'))
}

async function grabProgram(message: Message, callbacks: Callbacks, language?: Language) {
    const prompt = await message.channel.send(
        'Send your program in another message wrapped like:\n\n\\`\\`\\`\ncode here\n\\`\\`\\`')

    const success = (message: Message) => {
        const program = extractProgram(message.content)

        if (!program) {
            return grabProgram(message, callbacks, language)
        }

        program.language = program.language || language

        if (program.language) {
            return execute(message.channel, program)
        } else {
            return grabLanguage(message, callbacks, program.source, program.input)
        }
    }

    callbacks.addConversation(message.author.id, success, () => prompt.react('❌'))
}

export default async ({ message, remainder, params, callbacks }: Context) => {
    if (!params.length) {
        return grabProgram(message, callbacks)
    }

    const language = !params[0].startsWith('```') ? (toLanguage(params[0])) : null

    const program = extractProgram(remainder)

    if (!program) {
        return grabProgram(message, callbacks, language)
    }

    program.language = language || program.language

    if (!program.language) {
        return grabLanguage(message, callbacks, program.source, program.input)
    }

    return execute(message.channel, program)
}