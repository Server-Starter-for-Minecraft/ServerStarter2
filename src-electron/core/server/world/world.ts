import { Version } from '../version/version'

export class World {
    name: String
    version: Version

    constructor(name:String, version:Version) {
        this.name = name
        this.version = version
    }
}