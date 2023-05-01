import { versionTypes } from "app/src-electron/api/schema";
import { checkError } from "./components/Error/Error";
import { useMainStore } from "./stores/MainStore";
import { useWorldEditStore } from "./stores/WorldEditStore";
import { useSystemStore } from "./stores/SystemStore";

export async function InitWindow() {
  // storeの初期化
  // TODO: world情報の取得
  // const worldContainers = await window.API.invokeGetWorldContainers()
  // console.log(worldContainers)

  // checkError(
  //   worldContainers,
  //   (checked) => useMainStore().worldList = checked
  // )
  await getAllVersion(true)
  getAllVersion(false)
}

/**
 * サーバーバージョン一覧を取得する
 * @param useCache バージョンの取得にキャッシュを利用すると高速に取得し，
 *                 利用しないと正確なリストを通信して取得する
 */
async function getAllVersion(useCache: boolean) {
  const versions = await Promise.allSettled(
    versionTypes.map(
      type => { return window.API.invokeGetVersions(type, useCache) }
    )
  )

  versions.map((ver, i) => {
    if (ver.status == 'fulfilled') useSystemStore().serverVersions.set(versionTypes[i], checkError(ver.value))
  })
}