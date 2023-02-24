import { Version } from '../version/version'

export class World {
    name: string
    version: Version

    constructor(name: string, version: Version) {
        this.name = name
        this.version = version
    }

    run() {
        return `Server version is ${this.version.verType}`;
    }
}