import { fromEntries, keys, values } from 'app/src-public/scripts/obj/obj';
import { versionTypes } from 'app/src-electron/schema/version';
import { tError } from './i18n/utils/tFunc';
import { useConsoleStore } from './stores/ConsoleStore';
import { useMainStore } from './stores/MainStore';
import { useSystemStore } from './stores/SystemStore';
import {
  createNewWorld,
  updateBackWorld,
  useWorldStore,
} from './stores/WorldStore';
import { usePlayerStore } from './stores/WorldTabs/PlayerStore';
import { checkError } from './components/Error/Error';

export async function initWindow() {
  // storeの初期化
  const sysStore = useSystemStore();
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

  // ワールドの概略情報を取得
  checkError(
    worldAbbrFailables,
    (abbrs) => {
      if (abbrs !== void 0) {
        const validAbbrs = abbrs.flatMap((errorAbbr) => errorAbbr.value);
        worldStore.worldList = fromEntries(
          validAbbrs.map((abbr) => [abbr.id, { type: 'abbr', world: abbr }])
        );
        validAbbrs.forEach((abbr) => consoleStore.initTab(abbr.id));
      }
    },
    (e) => tError(e)
  );

  // 初回起動時は自動的に新規ワールドを追加
  if (paths.length === 0) {
    await createNewWorld();
  } else {
    const mainStore = useMainStore();
    const world = values(worldStore.sortedWorldList);
    mainStore.showWorld(world[0].world);
  }
}

export async function afterWindow() {
  // ワールドの詳細情報を取得
  getWorlds();

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
 * ワールドの詳細情報を取得する
 */
async function getWorlds() {
  const mainStore = useMainStore();
  const worldStore = useWorldStore();

  // Worldの詳細情報
  const worlds = await Promise.all(
    values(worldStore.worldList).map((w) =>
      window.API.invokeGetWorld(w.world.id)
    )
  );

  // 詳細情報を正常に取得できたワールドを抽出
  const errorWorlds = new Set(keys(mainStore.allWorlds.worlds));
  worlds.forEach((wFailable) => {
    checkError(
      wFailable.value,
      (w) => {
        worldStore.worldList[w.id] = { type: 'edited', world: w };
        errorWorlds.delete(w.id);
      },
      (e) => tError(e)
    );
  });

  // 正常に取得できなかったワールドを登録
  errorWorlds.forEach((wId) => mainStore.errorWorlds.add(wId));

  // backWorldを登録
  updateBackWorld();
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
