/**
 * TODO: 将来的には定数は関数の引数で受け取る設計に変更し，定数定義をここから呼び出す実装は削除する
 */
import * as electron from 'electron';
import { MemorySettings } from '../schema/memory';
import { Locale } from '../schema/system';

// アプリが扱うファイルの保存先（共通基盤の層で定義している）
export * from '../lifecycle/paths';

export const LEVEL_NAME = 'world' as const;

export const PLUGIN_NETHER_LEVEL_NAME = 'world_nether' as const;
export const PLUGIN_THE_END_LEVEL_NAME = 'world_the_end' as const;

export const DEFAULT_MEMORY: MemorySettings = {
  size: 2,
  unit: 'GB',
} as const;

// システムの言語設定がjaだった場合ja、それ以外の場合en-USに
export const getDefaultLocale = (): Locale => {
  if (import.meta.env?.QUASAR_DEV) return 'ja';
  return electron.app.getLocale() === 'ja' ? 'ja' : 'en-US';
};

export const NEW_WORLD_NAME = 'NewWorld';

export const WORLDNAME_REGEX_STR = '[a-zA-Z0-9_-]+';
export const WORLDNAME_REGEX = new RegExp(`^${WORLDNAME_REGEX_STR}$`);

export const BACKUP_DIRECTORY_NAME = '#backups';
export const BACKUP_EXT = 'ssbackup';
