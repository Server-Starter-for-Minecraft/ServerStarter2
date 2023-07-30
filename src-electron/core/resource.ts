import { StaticResouce } from '../schema/static';
import {
  DATAPACK_CACHE_PATH,
  MOD_CACHE_PATH,
  PLUGIN_CACHE_PATH,
} from './const';
import { minecraftColors } from './static/color';
import * as server_properties from './world/files/properties';

export const staticResoure: StaticResouce = {
  properties: server_properties.annotations,
  minecraftColors,
  paths: {
    cache: {
      datapack: DATAPACK_CACHE_PATH.str(),
      plugin: PLUGIN_CACHE_PATH.str(),
      mod: MOD_CACHE_PATH.str(),
    },
  },
};

/** フロントエンドから要求される定数を返す */
export async function getStaticResoure() {
  return staticResoure;
}
