import { Client } from 'discord.js'

import { invoke } from './commands'
import { Callbacks } from './callbacks'

function tryValue<T>(func: () => T): T | null {
  try {
    return func()
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function runDiscord() {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('Missing Token.')
  }

  const client = new Client()
  const callbacks = new Callbacks()

  client.on('ready', () => console.log('Ready.'))
  client.on('message', message => tryValue(() => invoke(message, callbacks)))
  client.on('messageReactionAdd', (reaction, user) => tryValue(() => callbacks.react(reaction, user.id)))

  await client.login(process.env.DISCORD_TOKEN)
}
