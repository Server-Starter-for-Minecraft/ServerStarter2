import { showUnexpectedError } from 'src/error/error';
import { keys, values } from 'app/src-public/scripts/obj/obj';
import { runDetached } from 'app/src-public/scripts/promise/runDetached';
import { versionTypes } from 'app/src-electron/schema/version';
import { WorldID } from 'app/src-electron/schema/world';
import { tError } from './i18n/utils/tFunc';
import { useMainStore } from './stores/MainStore';
import { useSystemStore, VersionLists } from './stores/SystemStore';
import {
  createNewWorld,
  registAbbrWorld,
  registWorldError,
  updateBackWorld,
  updateWorld,
} from './stores/WorldStore';
import { checkError } from './error/error';

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
    paths.map(async (path) => window.API.invokeGetWorldAbbrs(path))
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
  runDetached(
    getWorlds(keys(mainStore.allWorlds.readonlyWorlds)),
    showUnexpectedError
  );

  // GlobalIPを取得
  runDetached(getIP(), showUnexpectedError);

  // バージョンの読み込み
  runDetached(getAllVersion(false), showUnexpectedError);

  // datapackなどのCacheコンテンツの取得
  runDetached(getCacheContents(), showUnexpectedError);
}

/**
 * ワールドの詳細情報を取得する
 */
export async function getWorlds(wIds: WorldID[]) {
  const mainStore = useMainStore();

  // Worldの詳細情報
  const worlds = await Promise.all(
    wIds.map(async (wId) => window.API.invokeGetWorld(wId))
  );

  // 詳細情報を正常に取得できたワールドを抽出
  worlds.forEach((wFailable, idx) => {
    checkError(
      wFailable.value,
      (w) => updateWorld(w),
      (e) => {
        const errObj = tError(e);
        const wId = wIds[idx];
        // 正常に取得できなかったワールドを登録
        mainStore.errorWorlds.add(wId);
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

  /** サーバーの種類ごとにバージョンの一覧を取得して保存する */
  async function loadVersions<K extends (typeof versionTypes)[number]>(
    type: K
  ) {
    checkError(
      await window.API.invokeGetVersions(type, useCache),
      (vers) => {
        // 種類ごとに型が変わる一覧を，種類をキーとして保存する
        // （TypeScript では種類の型引数で引いた型（VersionLists[K]）へ代入できないため，型を合わせる）
        sysStore.serverVersions[type] = vers as VersionLists[K];
      },
      (e) => tError(e)
    );
  }

  await Promise.allSettled(versionTypes.map(loadVersions));
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
