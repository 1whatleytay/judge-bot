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

    description: ProblemDescription

    tests: TestCase[]
}

export function loadProblems(): Problem[] {
    const json = fs.readFileSync(process.env.PROBLEMS_JSON || 'problems/problems.json').toString()

    return JSON.parse(json).problems as Problem[]
}

export const problems = loadProblems()
