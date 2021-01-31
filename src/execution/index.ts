import Docker from 'dockerode'
import Registry from './registry'

import MemoryStream from 'memorystream'

import { Language, properties } from './languages'

// Global Variables :(((
let docker: Docker
let registry: Registry

// I feel like I'm struggling with typescript.
let images: Record<Language, string> = {
    [Language.CPP]: undefined,
    [Language.Java]: undefined,
    [Language.Python]: undefined,
    [Language.JavaScript]: undefined
}

export enum RunStatus {
    Success,
    Timeout,
    Error,

    InternalError,
}

export class RunInput {
    language: Language
    source: string
    input: string
}

export class RunResult {
    status: RunStatus
    result: string
}

export async function runProgram(program: RunInput): Promise<RunResult> {
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

        await container.start()

        let executionStopped = false

        setTimeout(async () => {
            if (!executionStopped) {
                executionStopped = true

                await container.stop()
            }
        }, 1000 * (process.env.MAX_EXECUTION_TIME ? parseInt(process.env.MAX_EXECUTION_TIME) : 10))

        const outStream = new MemoryStream()
        container.modem.demuxStream(stream, outStream, outStream)

        const chunks: Uint8Array[] = []
        const body = await new Promise<string>((resolve, reject) => {
            outStream.on('data', chunk => chunks.push(chunk))

            stream.on('error', reject)
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        })

        const hitTimeout = executionStopped
        executionStopped = true

        const state = await container.inspect()
        const success = state.State.ExitCode === 0

        await registry.clean(sourceFile)
        await registry.clean(inputFile)
        await container.remove()

        return {
            status: hitTimeout ? RunStatus.Timeout : (success ? RunStatus.Success : RunStatus.Error),
            result: body
        }
    } catch (e) {
        return {
            status: RunStatus.InternalError,
            result: e
        }
    }
}

async function buildImage(image: string): Promise<string> {
    const stream = await docker.buildImage({
        context: image,
        src: ['Dockerfile', 'bootstrap.sh']
    }, {
        t: image
    })

    await new Promise((resolve, reject) => {
        docker.modem.followProgress(stream,
            (err: any, res: any) => err ? reject(err) : resolve(res))
    })

    return image
}

async function getOrBuildImage(image: string) {
    const images = await docker.listImages()

    if (images.some(x => x.RepoTags.some(y => y === `${image}:latest`))) {
        console.log(`Using existing container ${image}.`)

        return image
    } else {
        console.log(`Building container ${image}.`)

        return await buildImage(image)
    }
}

export async function rebuildAllImages() {
    console.log('Rebuilding images...')

    for (const language of Object.keys(properties) as Language[]) {
        images[language] = await buildImage(properties[language].imagePath)
    }
}

export async function runDocker() {
    docker = new Docker()
    registry = new Registry(process.env.REGISTRY_LOCATION || 'temporary')

    for (const language of Object.keys(properties) as Language[]) {
        images[language] = await getOrBuildImage(properties[language].imagePath)
    }
}
