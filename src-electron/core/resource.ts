import { StaticResouce } from '../schema/static';
import { minecraftColors } from './static/color';
import * as server_properties from './world/files/properties';

export const staticResoure: StaticResouce = {
  properties: server_properties.annotations,
  minecraftColors,
};

/** フロントエンドから要求される定数を返す */
export async function getStaticResoure() {
  return staticResoure;
}
