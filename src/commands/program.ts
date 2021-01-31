import { Message, MessageEmbed, MessageReaction } from 'discord.js'
import { Callbacks } from './callbacks'
import { Language, properties, toLanguage } from '../execution/languages'
import { RunInput } from '../execution'

import { Context } from './context'

export type ExecuteCallback = (message: Message, input: RunInput) => void

export class Source {
    source: string
    language: string
}

export function parseSource(content: string): Source[] {
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

export function extractProgram(content: string): RunInput {
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


export async function grabLanguage(
    message: Message, callbacks: Callbacks, callback: ExecuteCallback, source?: string, input?: string) {
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
            prompt.delete()
            callbacks.dropReaction(prompt.id)

            if (source) {
                return callback(message, {source, input, language})
            } else {
                return grabProgram(message, callbacks, callback, language)
            }
        }
    }

    callbacks.addReaction(prompt.id, success, () => prompt.react('❌'))

    for (const x of Object.values(properties)) {
        await prompt.react(x.emoji)
    }
}

export async function grabProgram(
    message: Message, callbacks: Callbacks, callback: ExecuteCallback, language?: Language) {
    const prompt = await message.channel.send(
        'Send your program in another message wrapped like:\n\n\\`\\`\\`\ncode here\n\\`\\`\\`')

    const success = (message: Message) => {
        prompt.delete()

        const program = extractProgram(message.content)

        if (!program) {
            return grabProgram(message, callbacks, callback, language)
        }

        program.language = program.language || language

        if (program.language) {
            return callback(message, program)
        } else {
            return grabLanguage(message, callbacks, callback, program.source, program.input)
        }
    }

    callbacks.addConversation(message.author.id, success, () => prompt.react('❌'))
}

export async function runCommand({ message, callbacks, remainder, params }: Context, run: ExecuteCallback) {
    if (!params.length) {
        return grabProgram(message, callbacks, run)
    }

    const language = !params[0].startsWith('```') ? (toLanguage(params[0])) : null

    const program = extractProgram(remainder)

    if (!program) {
        return grabProgram(message, callbacks, run, language)
    }

    program.language = language || program.language

    if (!program.language) {
        return grabLanguage(message, callbacks, run, program.source, program.input)
    }

    return run(message, program)
}

export function sanitize(output: string, maxLength: number = 1000) {
    const zeroWidth = '`\u200b`\u200b`'

    return output.replace('```', zeroWidth).substring(0, maxLength) + (output.length > maxLength ? '...' : '')
}
