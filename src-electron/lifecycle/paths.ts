/**
 * アプリが扱うファイルの保存先
 *
 * util・ロガーなどの共通基盤からも参照するため，共通基盤の層（lifecycle）で定義する
 */
import { Path } from '../util/binary/path';
import { electron } from '../util/electron/runtime';

// Electron 外（スクリプト・テストなど）では，リポジトリ内の作業フォルダに保存する
const userDataPath = (
  import.meta.env.QUASAR_DEBUG || electron === undefined
    ? new Path('userData')
    : new Path(electron.app.getPath('userData'))
).absolute();

export const mainPath = userDataPath;

export const cachePath = mainPath.child('serverstarter/cache');
export const logDir =
  electron === undefined
    ? new Path('src-electron/logger/work/log')
    : mainPath.child('serverstarter/log');
export const tempPath = mainPath.child('serverstarter/temp');

export const settingPath = mainPath.child('serverstarter/settings.ssconfig');

export const runtimePath = cachePath.child('bin/runtime');
export const versionsCachePath = cachePath.child('versions');

export const ADDITIONALS_CACHE_PATH = cachePath.child('additionals');
export const DATAPACK_CACHE_PATH = ADDITIONALS_CACHE_PATH.child('datapacks');
export const PLUGIN_CACHE_PATH = ADDITIONALS_CACHE_PATH.child('plugins');
export const MOD_CACHE_PATH = ADDITIONALS_CACHE_PATH.child('mods');

/** zipファイルを展開するための一時パス */
export const unzipPath = tempPath.child('zip');

/** git操作をするための一時パス */
export const gitTempPath = tempPath.child('git');
