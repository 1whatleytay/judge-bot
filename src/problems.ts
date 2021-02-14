import fs from 'fs/promises'
import path from 'path'

export interface SampleCase {
    input: string
    output: string
    explanation?: string
}

export interface TestCase {
    input: string
    output: string

    file?: boolean
}

export interface ProblemDescription {
    general: string
    input: string
    output: string

    samples: SampleCase[]
}

export interface Problem {
    name: string
    channel: string
    example?: boolean

    description: ProblemDescription

    tests: TestCase[]
}

// Just check for missing files or duplicate files.
export async function verify(problem: Problem): Promise<boolean> {
    let files = [ ]

    for (const test of problem.tests) {
        if (test.file) {
            const input = path.resolve('data', test.input)
            const output = path.resolve('data', test.output)

            files.push(input, output)

            try {
                await fs.access(input)
                await fs.access(output)
            } catch (e) {
                return false
            }
        }
    }

    return new Set(files).size === files.length
}

export let problems: Problem[]

export async function loadProblems(): Promise<Problem[]> {
    console.log('Loading problems...')

    const problemsDir = process.env.PROBLEMS_DIR || 'problems'

    const loadAndParse = async (file: string): Promise<Problem | null> => {
        try {
            const content = await fs.readFile(`${problemsDir}/${file}`)

            return JSON.parse(content.toString())
        } catch {
            return null
        }
    }

    const files = await fs.readdir(problemsDir)
    const problems = (await Promise.all(files.map(loadAndParse))).filter(x => x && !x.example)

    return problems as Problem[]
}

export async function reloadProblems() {
    problems = await loadProblems()
}
