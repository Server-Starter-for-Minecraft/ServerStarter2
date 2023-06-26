import { isFailure } from 'app/src-electron/api/failable';
import { ServerSettingFile } from './base';
import { fixPlayerUUID } from '../../fixers/brands';
import {
  FAIL,
  arrayFixer,
  objectFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';
import { PlayerUUID } from 'app/src-electron/schema/brands';

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
    const value = await filePath.readJson<Whitelist>();
    if (isFailure(value)) return value;
    const fixed = fixOps(value);
    if (fixed === FAIL) return new Error(`${filePath} is invalid ops file`);
    return fixed;
  },
  save(cwdPath, value) {
    return cwdPath.child(WHILTELIST_FILE).writeText(JSON.stringify(value));
  },
};
