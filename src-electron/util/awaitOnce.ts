

/** 一度だけAsyncでデータを取得し、それ以降は以前取得したデータを使いまわす場合に使う */
export class AwaitOnce<T>{
    private value: (() => Promise<T>) | T
    private fetched = false
    constructor(fetch: () => Promise<T>) {
        this.value = fetch
    }

    async get(): Promise<T> {
        if (this.fetched) {
            return this.value as T
        }
        this.fetched = true
        this.value = (this.value as () => Promise<T>)() as T
        return await this.value
    }
}