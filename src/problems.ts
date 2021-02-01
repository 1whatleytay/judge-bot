import fs from 'fs'

export class TestCase {
    input: string
    output: string
}

export class ProblemDescription {
    general: string
    input: string
    output: string

    samples: TestCase[]
}

export class Problem {
    name: string
    channel: string
    example?: boolean

    description: ProblemDescription

    tests: TestCase[]
}

export function loadProblems(): Problem[] {
    console.log('Loading problems...')

    const problemsDir = process.env.PROBLEMS_DIR || 'problems'

    const loadAndParse = (file: string): Problem => {
        try {
            return JSON.parse(fs.readFileSync(`${problemsDir}/${file}`).toString())
        } catch {
            return null
        }
    }

    const problems = fs
        .readdirSync(problemsDir)
        .map(loadAndParse)
        .filter(x => x && !x.example)

    return problems as Problem[]
}

export const problems = loadProblems()
