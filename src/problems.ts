import path from 'path'
import fs from 'fs/promises'

export interface SampleCase {
    input: string
    output: string
    explanation?: string
}

export interface TestCaseDescription {
    type?: 'text' | 'file' | 'files'
    digital?: boolean

    input: string
    output: string
}

export interface TestCase {
    file: boolean
    digital?: boolean

    input: string
    output: string
}

export interface ProblemDescription {
    general: string
    input: string
    output: string

    samples: SampleCase[]
}

export interface Problem {
    id?: string
    name: string
    channel: string
    example?: boolean

    description: ProblemDescription

    tests: TestCaseDescription[]
}

export async function getTestCases(problem: Problem): Promise<TestCase[]> {
    const cases: TestCase[] = []

    let files: string[] | undefined

    for (const test of problem.tests) {
        if ((test.type === 'files' || test.type === 'file') && !problem.id) {
            throw new Error('Needs ID to load files.')
        }

        if (test.type === 'files') {
            // initialize once
            if (!files) {
                files = await fs.readdir(path.resolve('data', problem.id!))
            }

            const inputRegex = new RegExp(test.input)
            const outputRegex = new RegExp(test.output)
            const data: Record<string, { input?: string, output?: string }> = { }

            const getOrCreate = (c: string): Partial<TestCase> => {
                let entry = data[c]

                if (!entry) {
                    entry = { }
                    data[c] = entry
                }

                return entry
            }

            for (const file of files) {
                const inputMatch = inputRegex.exec(file)
                const outputMatch = outputRegex.exec(file)

                if (inputMatch && inputMatch.groups && inputMatch.groups.case) {
                    getOrCreate(inputMatch.groups.case).input = file
                }

                if (outputMatch && outputMatch.groups && outputMatch.groups.case) {
                    getOrCreate(outputMatch.groups.case).output = file
                }
            }

            for (const part of Object.values(data)) {
                if (!part.input || !part.output) {
                    throw new Error(`Matched one file ${part.input || part.output || '?'} but not matching file.`)
                }

                cases.push({
                    file: true,
                    digital: test.digital,

                    input: part.input,
                    output: part.output
                })
            }
        } else {
            cases.push({
                file: test.type === 'file',
                digital: test.digital,

                input: test.input,
                output: test.output
            })
        }
    }

    return cases
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
