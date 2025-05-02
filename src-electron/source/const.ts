/**
 * TODO: 将来的には定数は関数の引数で受け取る設計に変更し，定数定義をここから呼び出す実装は削除する
 */
import { app } from 'electron';
import { MemorySettings } from '../schema/memory';
import { Locale } from '../schema/system';
import { Path } from '../util/binary/path';

const userDataPath = (
  process.env.DEBUGGING || !app
    ? new Path('userData')
    : new Path(app?.getPath('userData'))
).absolute();

export const mainPath = userDataPath;

export const cachePath = mainPath.child('serverstarter/cache');
export const logDir = !app
  ? new Path('src-electron/common/work/log')
  : mainPath.child('serverstarter/log');
export const tempPath = mainPath.child('serverstarter/temp');

export const settingPath = mainPath.child('serverstarter/settings.ssconfig');

export const runtimePath = cachePath.child('bin/runtime');
export const versionsCachePath = cachePath.child('versions');

export const versionManifestPath = versionsCachePath.child(
  'vanilla/version_manifest_v2.json'
);

export const ADDITIONALS_CACHE_PATH = cachePath.child('additionals');
export const DATAPACK_CACHE_PATH = ADDITIONALS_CACHE_PATH.child('datapacks');
export const PLUGIN_CACHE_PATH = ADDITIONALS_CACHE_PATH.child('plugins');
export const MOD_CACHE_PATH = ADDITIONALS_CACHE_PATH.child('mods');

/** zipファイルを展開するための一時パス */
export const unzipPath = tempPath.child('zip');

/** git操作をするための一時パス */
export const gitTempPath = tempPath.child('git');

export const LEVEL_NAME = 'world' as const;

export const PLUGIN_NETHER_LEVEL_NAME = 'world_nether' as const;
export const PLUGIN_THE_END_LEVEL_NAME = 'world_the_end' as const;

export const DEFAULT_MEMORY: MemorySettings = {
  size: 2,
  unit: 'GB',
} as const;

// システムの言語設定がjaだった場合ja、それ以外の場合en-USに
export const getDefaultLocale = (): Locale => {
  if (import.meta.env?.DEV) return 'ja';
  return app.getLocale() === 'ja' ? 'ja' : 'en-US';
};

export const NEW_WORLD_NAME = 'NewWorld';

export const WORLDNAME_REGEX_STR = '[a-zA-Z0-9_-]+';
export const WORLDNAME_REGEX = new RegExp(`^${WORLDNAME_REGEX_STR}$`);

export const BACKUP_DIRECTORY_NAME = '#backups';
export const BACKUP_EXT = 'ssbackup';
