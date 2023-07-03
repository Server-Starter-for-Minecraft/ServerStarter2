import { versionTypes } from 'app/src-electron/schema/version';
import { checkError } from './components/Error/Error';
import { useMainStore } from './stores/MainStore';
import { useSystemStore } from './stores/SystemStore';
import { isValid } from './scripts/error';

export async function initWindow() {
  // storeの初期化
  const sysStore = useSystemStore();
  const mainStore = useMainStore();

  // TODO: awaitで実行するVersionの読み込みとWorldの読み込みを並列化
  // バージョンの読み込み
  await getAllVersion(true);

  // world読み込み
  const paths = [
    sysStore.systemSettings().container.default,
    ...Object.values(sysStore.systemSettings().container.custom),
  ];
  const worldAbbrFailables = await Promise.all(
    paths.map((path) => window.API.invokeGetWorldAbbrs(path))
  );
  // TODO: container or world が読み込めなかった場合にPopupを表示する
  const worldAbbrs = worldAbbrFailables.filter(isValid).flatMap((x) => x);
  const worlds = await Promise.all(
    worldAbbrs.flatMap(errorAbbr => errorAbbr.value).map(abbr => window.API.invokeGetWorld(abbr.id))
  );
  mainStore.worldList = worlds.map(errorWorld => errorWorld.value).filter(isValid);

  // TODO: getWorld()の処理が重いので、先にAbbrでUIを表示して、その後に読み込んだものからWorldを更新
  // Worldの読み込み中はそれぞれのワールドカードをLoadingにしておく
  // mainStore.worldListを (worldAbbr | world) にする？
}

export async function afterWindow() {
  // バージョンの読み込み
  getAllVersion(false);
}

/**
 * サーバーバージョン一覧を取得する
 * @param useCache バージョンの取得にキャッシュを利用すると高速に取得し，
 *                 利用しないと正確なリストを通信して取得する
 */
async function getAllVersion(useCache: boolean) {
  const versions = await Promise.allSettled(
    versionTypes.map((type) => {
      return window.API.invokeGetVersions(type, useCache);
    })
  );

  versions.map((ver, i) => {
    if (ver.status == 'fulfilled')
      useSystemStore().serverVersions.set(
        versionTypes[i],
        checkError(ver.value)
      );
  });
}
