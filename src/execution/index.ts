import Docker from 'dockerode'
import Registry from './registry'
import Semaphore from './semaphore'

import MemoryStream from 'memorystream'

import { Language, properties } from './languages'

import os from 'os'
import path from 'path'
import fs from 'fs/promises'

// Global Variables :(((
let docker: Docker
let registry: Registry
let semaphore: Semaphore

// I feel like I'm struggling with typescript.
let images: Partial<Record<Language, string>> = { }

export enum RunStatus {
    Success,
    Timeout,
    Error,

    InternalError,
}

export interface RunInput {
    language: Language
    source: string
    input: string
}

export interface RunResult {
    status: RunStatus
    result: string
}

export async function runProgram(program: RunInput): Promise<RunResult> {
    await semaphore.take()

    try {
        const Image = images[program.language]
        if (!Image) {
            return {
                status: RunStatus.InternalError,
                result: `Missing image for ${program.language}.`
            }
        }

        const sourceFile = await registry.create(program.source)
        const inputFile = await registry.create(program.input)

        const container = await docker.createContainer({
            Image,
            HostConfig: {
                Binds: [
                    `${sourceFile}:/mnt/source.${program.language}:ro`,
                    `${inputFile}:/mnt/input.txt:ro`
                ],
                Memory: 1024 * 1024 * 128,
                MemorySwap: 0,
                CpuPeriod: 100000,
                CpuQuota: 100000
            },
            OpenStdin: false,
            AttachStdin: false,
            AttachStdout: true,
            AttachStderr: true,
            NetworkDisabled: true
        })

        const stream = await container.attach({
            stream: true,
            stdout: true,
            stderr: true
        })

        const outStream = new MemoryStream()
        container.modem.demuxStream(stream, outStream, outStream)

        const chunks: Uint8Array[] = []
        outStream.on('data', chunk => chunks.push(chunk))

        await container.start()

        let hitTimeout = false

        setTimeout(async () => {
            try {
                hitTimeout = true

                await container.stop({ t: 0 })
            } catch { }
        }, 1000 * parseInt(process.env.MAX_EXECUTION_TIME || '10'))
        
        await container.wait()

        const body = Buffer.concat(chunks).toString('utf8')

        const state = await container.inspect()
        const success = state.State.ExitCode === 0

        await registry.clean(sourceFile)
        await registry.clean(inputFile)
        await container.remove()

        semaphore.leave()

        return {
            status: hitTimeout ? RunStatus.Timeout : (success ? RunStatus.Success : RunStatus.Error),
            result: body
        }
    } catch (e) {
        console.log(e)

        semaphore.leave()

        return {
            status: RunStatus.InternalError,
            result: e
        }
    }
}

async function pickDockerfile(context: string): Promise<string> {
    const arch = os.arch()

    try {
        const archDockerfile = `${arch}.dockerfile`

        const url = path.resolve(context, archDockerfile)
        await fs.access(url)

        return archDockerfile
    } catch { }

    return 'default.dockerfile'
}

function makeDockerTag(name: string): string {
    return `judge-bot-${name}`
}

async function buildImage(name: string): Promise<string | undefined> {
    const context = path.resolve('images', name)
    const dockerfile = await pickDockerfile(context)

    const tag = makeDockerTag(name)
    
    const stream = await docker.buildImage({
        context,
        src: [dockerfile, 'bootstrap.sh']
    }, {
        dockerfile,
        t: tag
    })

    try {
        await new Promise((resolve, reject) => {
            stream.on('data', data => {
                try {
                    for (const part of data.toString('utf8').split('\r\n')) {
                        if (JSON.parse(part.toString('utf8')).errorDetail) {
                            reject()
                        }
                    }
                } catch { }
            })

            docker.modem.followProgress(stream,
                (err: any, res: any) => err ? reject(err) : resolve(res))
        })

        return tag
    } catch {
        return undefined
    }
}

async function getOrBuildImage(name: string): Promise<string | undefined> {
    const images = await docker.listImages()

    const tag = makeDockerTag(name)

    if (images.some(x => x.RepoTags.some(y => y === `${tag}:latest`))) {
        return tag
    } else {
        return buildImage(name)
    }
}

// Returns array of languages that successfully rebuilt.
export async function rebuildAllImages(): Promise<Language[]> {
    console.log('Rebuilding images...')

    let languages: Language[] = []

    for (const language of Object.keys(properties) as Language[]) {
        const image = await buildImage(properties[language].imageName)

        if (image) {
            images[language] = image

            languages.push(language)
        }
    }

    return languages
}

export async function runDocker() {
    const maxInstances = parseInt(process.env.MAX_DOCKER_INSTANCES || '3')

    docker = new Docker()
    registry = new Registry(process.env.REGISTRY_LOCATION || 'temporary')
    semaphore = new Semaphore(maxInstances)

    console.log('Building images...')
    for (const language of Object.keys(properties) as Language[]) {
        const image = await getOrBuildImage(properties[language].imageName)

        if (image) {
            console.log(`Built image for ${properties[language].commonName}.`)
            images[language] = image
        } else {
            console.log(`Failed to build image for ${properties[language].commonName}.`)
        }
    }
}
