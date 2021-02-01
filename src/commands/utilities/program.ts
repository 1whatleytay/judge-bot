import { Snowflake, Message, MessageEmbed, MessageReaction } from 'discord.js'

import { Callbacks } from '../../callbacks'

import { RunInput } from '../../execution'
import { Language, properties, toLanguage } from '../../execution/languages'

import { Context } from './context'

export type ExecuteCallback = (message: Message, input: RunInput) => void

export interface Source {
    source: string
    language: string
}

export function parseSource(content: string): Source[] {
    const regex = /```(?<language>\w+)?\n(?<source>(.|\s)*?)\n```/g

    const results: Source[] = [ ]

    while (true) {
        const result = regex.exec(content)

        if (!result || !result.groups) {
            break
        }
        
        results.push({
            source: result.groups.source,
            language: result.groups.language
        })
    }

    return results
}

export function extractProgram(content: string): Partial<RunInput> | null {
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
    const description = Object.values(properties).map(x => `${x.emoji} ${x.commonName}`).join('\n\n')

    const embed = new MessageEmbed()
        .setColor('DARK_AQUA')
        .setTitle('Pick a compilation language.')
        .setDescription(description)

    const prompt = await message.channel.send(embed)

    const success = (reaction: MessageReaction, user: Snowflake) => {
        if (user === message.client.user?.id) {
            return
        }

        const languages = Object.keys(properties) as Language[]
        const language = languages.find(x => properties[x].emoji === reaction.emoji.name)

        if (language) {
            prompt.delete()
            callbacks.dropReaction(prompt.id)

            if (source) {
                return callback(message, {source, input: input || '', language})
            } else {
                return grabProgram(message, callbacks, callback, language)
            }
        }
    }

    callbacks.addReaction(prompt.id, success, () => prompt.react('❌'))

    try {
        for (const x of Object.values(properties)) {
            await prompt.react(x.emoji)
        }
    } catch { }
}

export async function grabProgram(
    message: Message, callbacks: Callbacks, callback: ExecuteCallback, language?: Language) {
    const prompt = await message.channel.send(
        'Send your program in another message wrapped like:\n\n\\`\\`\\`\ncode here\n\\`\\`\\`')

    const success = (message: Message) => {
        prompt.delete()

        const program = extractProgram(message.content)

        if (!program) {
            return
        }

        const { source, input } = program

        if (source === undefined || input === undefined) {
            return message.channel.send('Internal error.')
        }

        callbacks.dropConversation(message.author.id)

        const baseLanguage = program.language || language

        if (baseLanguage) {
            return callback(message, { source, input, language: baseLanguage })
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

    const program = extractProgram(remainder)

    const baseLanguage = !params[0].startsWith('```') ? (toLanguage(params[0])) : undefined

    if (!program) {
        return grabProgram(message, callbacks, run, baseLanguage)
    }

    const language = baseLanguage || program.language

    if (!language) {
        return grabLanguage(message, callbacks, run, program.source, program.input)
    }

    const { source, input } = program

    if (source === undefined || input === undefined) {
        return message.channel.send('Internal error.')
    }

    return run(message, { source, input, language })
}

export function sanitize(output: string, maxLength: number = 1000) {
    const zeroWidth = '`\u200b`\u200b`'

    return output.replace('```', zeroWidth).substring(0, maxLength) + (output.length > maxLength ? '...' : '')
}
