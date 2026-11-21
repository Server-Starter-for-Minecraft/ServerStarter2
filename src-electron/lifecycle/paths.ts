/**
 * アプリが扱うファイルの保存先
 *
 * util・ロガーなどの共通基盤からも参照するため，共通基盤の層（lifecycle）で定義する
 */
// Electron外(スクリプト・テスト環境など)ではnamed exportが存在しないため，名前空間でimportする
import * as electron from 'electron';
import { Path } from '../util/binary/path';

const userDataPath = (
  import.meta.env.QUASAR_DEBUG || !electron.app
    ? new Path('userData')
    : new Path(electron.app.getPath('userData'))
).absolute();

export const mainPath = userDataPath;

export const cachePath = mainPath.child('serverstarter/cache');
export const logDir = !electron.app
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
