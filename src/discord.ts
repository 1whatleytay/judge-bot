import { Client } from 'discord.js'

import { invoke } from './commands'
import { Callbacks } from './commands/callbacks'

export async function runDiscord() {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error('Missing Token.')
  }

  const client = new Client()
  const callbacks = new Callbacks()

  client.on('ready', () => console.log('Ready.'))
  client.on('message', message => invoke(message, callbacks))
  client.on('messageReactionAdd', (reaction, user) => callbacks.react(reaction, user.id))

  await client.login(process.env.DISCORD_TOKEN)
}
