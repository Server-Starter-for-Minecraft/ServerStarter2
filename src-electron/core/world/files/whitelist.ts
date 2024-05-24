import { PlayerUUID } from 'app/src-electron/schema/brands';
import {
  arrayFixer,
  FAIL,
  objectFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { fixPlayerUUID } from '../../fixers/brands';
import { ServerSettingFile } from './base';

export type WhitelistRecord = {
  uuid: PlayerUUID;
  name: string;
};

export type Whitelist = WhitelistRecord[];

export const fixWhiltelistRecord = objectFixer<WhitelistRecord>(
  {
    uuid: fixPlayerUUID,
    name: stringFixer(),
  },
  false
);

export const fixOps = arrayFixer(fixWhiltelistRecord, false);

export const WHILTELIST_FILE = 'whitelist.json';

export const serverWhitelistFile: ServerSettingFile<Whitelist> = {
  async load(cwdPath) {
    const filePath = cwdPath.child(WHILTELIST_FILE);

    // ファイルが存在しない場合空リストを返す
    if (!filePath.exists()) return [];

    const value = await filePath.readJson<Whitelist>();

    if (isError(value)) return value;
    const fixed = fixOps(value);

    if (fixed === FAIL)
      return errorMessage.data.path.invalidContent.invalidWhitelistJson({
        type: 'file',
        path: filePath.path,
      });
    return fixed;
  },
  save(cwdPath, value) {
    return cwdPath.child(WHILTELIST_FILE).writeText(JSON.stringify(value));
  },
  path(cwdPath) {
    return cwdPath.child(WHILTELIST_FILE);
  },
};
