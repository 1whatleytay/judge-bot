import { config } from 'dotenv'

import { runDocker } from './execution'
import { runDiscord } from './discord'

async function run() {
  config()

  await runDocker()
  await runDiscord()
}

run().then(() => console.log('Done.'))
