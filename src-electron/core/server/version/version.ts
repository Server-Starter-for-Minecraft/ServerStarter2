type VersionType = 
    | 'Vanilla'
    | 'Spigot'
    | 'PaperMC'
    | 'Forge'
    | 'MohistMC';

export class Version {
    verType: VersionType
    name: string

    constructor(verType:VersionType, name:string) {
        this.verType = verType
        this.name = name
    }
}