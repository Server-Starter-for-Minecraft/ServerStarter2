import { StaticResouce } from '../schema/static';
import * as server_properties from './world/files/properties';

export const staticResoure: StaticResouce = {
  properties: server_properties.annotations,
};

/** フロントエンドから要求される定数を返す */
export async function getStaticResoure() {
  return staticResoure;
}
