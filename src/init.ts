import { keys, values } from 'app/src-public/scripts/obj/obj';
import { versionTypes } from 'app/src-electron/schema/version';
import { WorldID } from 'app/src-electron/schema/world';
import { tError } from './i18n/utils/tFunc';
import {
  UNKNOWN_VERSION_ERROR_REASON,
  useErrorWorldStore,
} from './stores/ErrorWorldStore';
import { useMainStore } from './stores/MainStore';
import { useSystemStore } from './stores/SystemStore';
import {
  createNewWorld,
  registAbbrWorld,
  registWorldError,
  updateBackWorld,
  updateWorld,
} from './stores/WorldStore';
import { usePlayerStore } from './stores/WorldTabs/PlayerStore';
import { checkError } from './components/Error/Error';

export async function initWindow() {
  // storeの初期化
  const sysStore = useSystemStore();
  const mainStore = useMainStore();

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
        validAbbrs.forEach((abbr) => registAbbrWorld(abbr));
      }
    },
    (e) => tError(e)
  );

  // 初回起動時は自動的に新規ワールドを追加
  if (paths.length === 0) {
    await createNewWorld();
  }
  // ワールドが１つしかないときには当該ワールドをデフォルトの表示ワールドとする
  // TODO: バックエンドで「以前に起動したワールド」の情報を持つようになった際には，そのワールドをデフォルトの表示ワールドとする
  const worlds = mainStore.allWorlds.filteredWorlds();
  if (keys(worlds).length === 1) {
    mainStore.showWorld(values(worlds)[0].world);
  }
}

export async function afterWindow() {
  // ワールドの詳細情報を取得
  const mainStore = useMainStore();
  getWorlds(keys(mainStore.allWorlds.readonlyWorlds));

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
export async function getWorlds(wIds: WorldID[]) {
  const errorWorldStore = useErrorWorldStore();

  // Worldの詳細情報
  const worlds = await Promise.all(
    wIds.map((wId) => window.API.invokeGetWorld(wId))
  );

  // 詳細情報を正常に取得できたワールドを抽出
  worlds.forEach((wFailable, idx) => {
    checkError(
      wFailable.value,
      (w) => {
        if (w.version.type === 'unknown')
          errorWorldStore.lock(w.id, UNKNOWN_VERSION_ERROR_REASON);
        updateWorld(w);
      },
      (e) => {
        const ERROR_REASON = 'init_world_is_invalid';
        const errObj = tError(e);
        const wId = wIds[idx];
        // 正常に取得できなかったワールドを登録
        errorWorldStore.lock(wId, ERROR_REASON);
        // エラー理由を登録
        registWorldError(wId, errObj);
        return errObj;
      }
    );
  });

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
