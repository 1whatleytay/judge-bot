import fs from 'fs'
import path from 'path'

import { v4 as uuid } from 'uuid'

export default class Registry {
    async create(text: string, name?: string): Promise<string> {
        const fileName = name || uuid()
        const location = `${this.location}/${fileName}`

        await fs.promises.writeFile(location, text)

        return path.resolve(location)
    }

    async clean(path: string) {
        await fs.promises.unlink(path)
    }

    constructor(public location: string = 'temporary') {
        if (!fs.existsSync(location)) {
            fs.mkdirSync(location)
        }
    }
}