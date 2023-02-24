type VersionType = 
    | 'vanilla'
    | 'Spigot'
    | 'PaperMC'
    | 'Forge'
    | 'MohistMC';

export class Version {
    verType: VersionType

    constructor(verType:VersionType) {
        this.verType = verType
    }
}