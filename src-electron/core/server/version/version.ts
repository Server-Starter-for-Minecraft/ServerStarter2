type VersionType = 
    | 'Vanilla'
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