import { Version } from "app/src-electron/schema/version";
import { getHashData } from "src/scripts/obj";

/**
 * 新しい方のバージョンの引数番号を返す
 * 
 * `ops`にはバージョン一覧を格納するが，これは最新バージョンが0番目に来ている必要アリ
 * 
 * - `ver_1`が新しい場合，戻り値は`-1`
 * - `ver1`が新しい場合，戻り値は`1`
 * - 両者が同じ場合，戻り値は`0`
 */
export async function newerVerIdx<T extends Version>(ops: T[], ver_1: T, ver1: T) {
  const hashs = await getHashs(ops)
  const idx_1 = hashs.indexOf(await getHashData(ver_1))
  const idx1 = hashs.indexOf(await getHashData(ver1))

  const returnVal = idx_1 - idx1
  return idx_1 === idx1 ? 0 : returnVal / Math.abs(returnVal)
}

function getHashs<T extends Version>(ops: T[]) {
  return Promise.all(ops.map(v => getHashData(v)))
}