import { Version } from "app/src-electron/schema/version"

type contentExists = { [ver in Version['type']]: { datapack: boolean, plugin: boolean, mod: boolean } }
export const isContentsExists: contentExists = {
  'vanilla' : { datapack: true, plugin: false, mod: false },
  'spigot'  : { datapack: true, plugin: true , mod: false },
  'papermc' : { datapack: true, plugin: true , mod: false },
  'forge'   : { datapack: true, plugin: false, mod: true  },
  'mohistmc': { datapack: true, plugin: true , mod: true  },
  'fabric'  : { datapack: true, plugin: false, mod: true  },
}