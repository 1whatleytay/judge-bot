import { Message } from 'discord.js'

import { Callbacks } from '../../callbacks'

export interface Context {
  message: Message
  callbacks: Callbacks

  remainder: string
  params: string[]
}

export type CommandType = (context: Context) => void

