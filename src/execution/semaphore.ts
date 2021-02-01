type PromiseResolve = (value: unknown) => void

export default class Semaphore {
    private count = 0
    private queue: PromiseResolve[] = [ ]

    async take() {
        if (this.count < this.max) {
            this.count++

            return
        }

        return new Promise(resolve => {
            if (this.count < this.max) {
                resolve(undefined)
            } else {
                this.queue.push(resolve)
            }
        })
    }

    leave() {
        if (this.queue.length) {
            this.queue.shift()?.(undefined)
        } else {
            this.count--
        }
    }

    constructor(private max: number) { }
}