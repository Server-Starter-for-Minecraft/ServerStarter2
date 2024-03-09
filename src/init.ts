import { versionTypes } from 'app/src-electron/schema/version';
import { World } from 'app/src-electron/schema/world';
import { checkError } from './components/Error/Error';
import { useMainStore, useWorldStore } from './stores/MainStore';
import { useSystemStore } from './stores/SystemStore';
import { useConsoleStore } from './stores/ConsoleStore';
import { usePlayerStore } from './stores/WorldTabs/PlayerStore';
import { fromEntries, values } from './scripts/obj';
import { tError } from './i18n/utils/tFunc';

export async function initWindow() {
  // storeの初期化
  const sysStore = useSystemStore();
  const mainStore = useMainStore();
  const worldStore = useWorldStore();
  const consoleStore = useConsoleStore();

  // static resourcesの読み込み
  sysStore.staticResouces = await window.API.invokeGetStaticResouce();

  // TODO: awaitで実行するVersionの読み込みとWorldの読み込みを並列化
  // バージョンの読み込み
  await getAllVersion(true);

  // world読み込み
  const paths = sysStore.systemSettings.container.map((c) => c.container);
  const worldAbbrFailables = await Promise.all(
    paths.map((path) => window.API.invokeGetWorldAbbrs(path))
  );

  // ワールドの詳細情報を取得
  const worldAbbrs = checkError(worldAbbrFailables, undefined, (e) =>
    tError(e)
  );
  if (worldAbbrs !== void 0) {
    const worlds = await Promise.all(
      worldAbbrs
        .flatMap((errorAbbr) => errorAbbr.value)
        .map((abbr) => window.API.invokeGetWorld(abbr.id))
    );

    const localWorlds = [] as World[];
    worlds.map((wFailable) => {
      checkError(
        wFailable.value,
        (w) => localWorlds.push(w),
        (e) => tError(e)
      );
    });

    worldStore.worldList = fromEntries(localWorlds.map((w) => [w.id, w]));
    localWorlds.forEach((w) => consoleStore.initTab(w.id));
  }

  if (Object.keys(mainStore.searchWorld()).length === 0) {
    await mainStore.createNewWorld();
  } else {
    const world = values(worldStore.sortedWorldList);
    mainStore.setWorld(world[world.length - 1]);
  }

  // TODO: getWorld()の処理が重いので、先にAbbrでUIを表示して、その後に読み込んだものからWorldを更新
  // Worldの読み込み中はそれぞれのワールドカードをLoadingにしておく
  // mainStore.worldListを (worldAbbr | world) にする？
}

export async function afterWindow() {
  // GlobalIPを取得
  getIP();

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
  const sysStore = useSystemStore();

  const versions = await Promise.allSettled(
    versionTypes.map((type) => {
      return window.API.invokeGetVersions(type, useCache);
    })
  );

  versions.map((ver, i) => {
    if (ver.status == 'fulfilled') {
      checkError(
        ver.value,
        (vers) => sysStore.serverVersions.set(versionTypes[i], vers),
        (e) => tError(e)
      );
    }
  });
}

/**
 * プレイヤーデータの取得を行っておき、キャッシュデータの作成を行う
 */
async function getCachePlayers() {
  const sysStore = useSystemStore();
  const playerStore = usePlayerStore();
  const playerUUIDs = sysStore.systemSettings.player.players;
  const failablePlayers = await Promise.all(
    playerUUIDs.map((uuid) => window.API.invokeGetPlayer(uuid, 'uuid'))
  );
  failablePlayers.forEach((fp) =>
    checkError(
      fp,
      (p) => (playerStore.cachePlayers[p.uuid] = p),
      (e) => tError(e)
    )
  );
}

/**
 * Datapack / Plugin / MODのキャッシュデータを取得する
 */
export async function getCacheContents() {
  const sysStore = useSystemStore();
  sysStore.cacheContents.datapacks = (
    await window.API.invokeGetCacheContents('datapack')
  ).value;
  sysStore.cacheContents.plugins = (
    await window.API.invokeGetCacheContents('plugin')
  ).value;
  sysStore.cacheContents.mods = (
    await window.API.invokeGetCacheContents('mod')
  ).value;
}

async function getIP() {
  const sysStore = useSystemStore();
  const res = await window.API.invokeGetGlobalIP();
  checkError(
    res,
    (ip) => (sysStore.publicIP = ip),
    (e) => tError(e)
  );
}
