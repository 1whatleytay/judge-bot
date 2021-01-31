import { Message } from 'discord.js'

import { CommandType } from './context'
import { Callbacks } from './callbacks'

import ping from './ping'
import post from './post'
import judge from './judge'
import compile from './compile'
import rebuild from './rebuild'

export const commands = {
    ping,
    post,
    judge,
    compile,
    rebuild
} as Record<string, CommandType>

export function invoke(message: Message, callbacks: Callbacks) {
    try {
        const prefix = process.env.DISCORD_PREFIX || '-'

        let matched = false

        if (message.content.startsWith(prefix)) {
            const command = message.content.substring(prefix.length).trim()
            const parts = command.split(/(\s+)/)

            if (!parts.length) {
                return
            }

            for (const key of Object.keys(commands)) {
                if (parts[0] == key) {
                    const remainder = command.substring(key.length).trim()
                    const params = remainder.split(/(\s+)/)

                    const context = { message, callbacks, remainder, params }
                    commands[key](context)

                    matched = true

                    break
                }
            }
        }

        if (!matched) {
            callbacks.invoke(message)
        } else {
            callbacks.dropConversation(message.author.id)
        }
    } catch (e) {
        console.error(e)
    }
}
