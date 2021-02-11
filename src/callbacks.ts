import { Message, MessageReaction, Snowflake } from 'discord.js'

export type ReactionCallback = (reaction: MessageReaction, user: string) => void
export type ConversationCallback = (message: Message) => void

class Callback<T> {
    callback: T
    expire?: VoidFunction
    expiry: number

    constructor(callback: T, expire?: VoidFunction) {
        const expiry = parseInt(process.env.CALLBACK_EXPIRY_TIMEOUT || `${30 * 60}`)

        this.callback = callback
        this.expire = expire
        this.expiry = Date.now() + expiry * 1000
    }
}

export class Callbacks {
    reactions: Record<string, Callback<ReactionCallback>> = { }
    conversations: Record<string, Callback<ConversationCallback>> = { }

    addReaction(id: Snowflake, callback: ReactionCallback, expire?: VoidFunction) {
        this.reactions[id] = new Callback<ReactionCallback>(callback, expire)
    }

    addConversation(id: Snowflake, callback: ConversationCallback, expire?: VoidFunction) {
        this.conversations[id] = new Callback<ConversationCallback>(callback, expire)
    }

    dropReaction(id: Snowflake) {
        delete this.reactions[id]
    }

    dropConversation(id: Snowflake) {
        delete this.conversations[id]
    }

    react(reaction: MessageReaction, user: string) {
        const id = reaction.message.id
        const callback = this.reactions[id]

        if (!callback || !callback.callback) {
            return
        }

        callback.callback(reaction, user)
    }

    invoke(message: Message) {
        const id = message.author.id
        const callback = this.conversations[id]

        if (!callback || !callback.callback) {
            return
        }

        callback.callback(message)
    }

    expire<T>(callbacks: Record<string, Callback<T>>) {
        for (const id in Object.keys(callbacks)) {
            const conversation = callbacks[id]

            if (conversation.expiry < Date.now()) {
                try {
                    conversation?.expire?.()
                } catch { }

                delete callbacks[id]
            }
        }
    }

    clean() {
        this.expire(this.reactions)
        this.expire(this.conversations)
    }

    constructor() {
        const timeout = parseInt(process.env.CALLBACK_CLEAN_TIMEOUT || `${(30 * 60)}`)

        setInterval(() => this.clean(), timeout * 1000)
    }
}