import { Snowflake, Client, Message, GuildEmoji } from 'discord.js'

export function getIndicatorId(): Snowflake {
    return process.env.INDICATOR_ID || '805489619268272138'
}

export function getIndicator(client: Client): GuildEmoji | undefined {
    return client.emojis.cache.get(getIndicatorId())
}

export async function addIndicator(message: Message) {
    try {
        const indicator = getIndicator(message.client)

        if (!indicator) {
            return
        }

        await message.react(indicator)
    } catch { }
}

export async function dropIndicator(message: Message) {
    try {
        const botId = message.client.user?.id

        if (botId) {
            await message.reactions.cache.get(getIndicatorId())?.users.remove(botId)
        }
    } catch { }
}
