import { config } from 'dotenv'

import { runDocker } from './execution'
import { runDiscord } from './discord'
import { reloadProblems } from './problems'

async function run() {
  config()

  await reloadProblems()

  await runDocker()
  await runDiscord()
}

run().then(() => console.log('Done.'))
