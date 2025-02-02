import { StaticResouce } from '../../schema/static';

/** フロントエンドから要求される定数を返す */
export async function getStaticResoure() {
  return StaticResouce.parse({});
}
