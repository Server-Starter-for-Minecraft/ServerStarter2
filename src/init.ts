import { versionTypes } from 'app/src-electron/api/schema';
import { checkError } from './components/Error/Error';
import { useMainStore } from './stores/MainStore';
import { useSystemStore } from './stores/SystemStore';
import { isSuccess } from 'app/src-electron/api/failable';


export async function InitWindow() {
  // storeの初期化
  const sysStore = useSystemStore()
  const mainStore = useMainStore()

  // TODO: awaitで実行するVersionの読み込みとWorldの読み込みを並列化
  // バージョンの読み込み
  await getAllVersion(true)
  getAllVersion(false)

  // world読み込み
  sysStore.worldContainers = await window.API.invokeGetWorldContainers()
  const paths = [sysStore.worldContainers.default, ...Object.values(sysStore.worldContainers.custom)]
  const worldAbbrFailables = await Promise.all(paths.map(window.API.invokeGetWorldAbbrs))
  // TODO: container or world が読み込めなかった場合にPopupを表示する
  const worldAbbrs = worldAbbrFailables.filter(isSuccess).flatMap(x => x)
  const worlds = await Promise.all(worldAbbrs.map(window.API.invokeGetWorld))
  mainStore.worldList = worlds.filter(isSuccess)

  // TODO: getWorld()の処理が重いので、先にAbbrでUIを表示して、その後に読み込んだものからWorldを更新
  // Worldの読み込み中はそれぞれのワールドカードをLoadingにしておく
  // mainStore.worldListを (worldAbbr | world) にする？
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