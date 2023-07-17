import { versionTypes } from 'app/src-electron/schema/version';
import { checkError } from './components/Error/Error';
import { useMainStore, useWorldStore } from './stores/MainStore';
import { useSystemStore } from './stores/SystemStore';
import { usePlayerStore } from './stores/WorldTabs/PlayerStore';
import { isValid } from './scripts/error';
import { fromEntries, values } from './scripts/obj';

export async function initWindow() {
  // storeの初期化
  const sysStore = useSystemStore();
  const mainStore = useMainStore();
  const worldStore = useWorldStore();

  // static resourcesの読み込み
  sysStore.staticResouces = await window.API.invokeGetStaticResouce()

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

  const localWorlds = worlds.map(errorWorld => errorWorld.value).filter(isValid);
  worldStore.worldList = fromEntries(localWorlds.map(w => [w.id, w]));

  if (Object.keys(worldStore.worldList).length === 0) {
    await mainStore.createNewWorld()
  }
  else[
    mainStore.setWorld(values(worldStore.worldList)[0])
  ]
  // TODO: getWorld()の処理が重いので、先にAbbrでUIを表示して、その後に読み込んだものからWorldを更新
  // Worldの読み込み中はそれぞれのワールドカードをLoadingにしておく
  // mainStore.worldListを (worldAbbr | world) にする？
}

export async function afterWindow() {
  // バージョンの読み込み
  getAllVersion(false);

  // システムに登録済みのプレイヤーデータを取得しておく
  getCachePlayers();

  // datapackなどのCacheコンテンツの取得
  getCacheContents();
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

/**
 * プレイヤーデータの取得を行っておき、キャッシュデータの作成を行う
 */
async function getCachePlayers() {
  const sysStore = useSystemStore();
  const playerStore = usePlayerStore();
  const playerUUIDs = sysStore.systemSettings().player.players
  const failablePlayers = await Promise.all(playerUUIDs.map(uuid => window.API.invokeGetPlayer(uuid, 'uuid')))
  failablePlayers.forEach(fp => checkError(fp, p => playerStore.cachePlayers[p.uuid] = p, `プレイヤーデータの取得に失敗しました（UUIDなどの取得できなかったプレイヤーデータを表示する？）`))
}

/**
 * Datapack / Plugin / MODのキャッシュデータを取得する
 */
export async function getCacheContents() {
  const sysStore = useSystemStore();
  sysStore.cacheContents.datapacks = (await window.API.invokeGetCacheContents('datapack')).value
  sysStore.cacheContents.plugins = (await window.API.invokeGetCacheContents('plugin')).value
  sysStore.cacheContents.mods = (await window.API.invokeGetCacheContents('mod')).value
}