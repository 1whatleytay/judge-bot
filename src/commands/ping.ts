import { Context } from './context'

export default async ({ message }: Context) => {
  await message.channel.send('Pong!')
}
