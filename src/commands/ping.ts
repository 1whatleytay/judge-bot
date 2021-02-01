import { Context } from './utilities/context'

export default async ({ message }: Context) => {
  await message.channel.send('Pong!')
}
