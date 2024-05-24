import { OpLevel } from 'src-electron/schema/player';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import {
  arrayFixer,
  booleanFixer,
  FAIL,
  objectFixer,
  stringFixer,
} from 'app/src-electron/util/detaFixer/fixer';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { fixPlayerUUID } from '../../fixers/brands';
import { fixOpLevel } from '../../fixers/player';
import { ServerSettingFile } from './base';

export type OpRecord = {
  uuid: PlayerUUID;
  name: string;
  level: OpLevel;
  bypassesPlayerLimit: boolean;
};

export type Ops = OpRecord[];

export const fixOpRecord = objectFixer<OpRecord>(
  {
    uuid: fixPlayerUUID,
    name: stringFixer(),
    level: fixOpLevel,
    bypassesPlayerLimit: booleanFixer(false),
  },
  false
);

export const fixOps = arrayFixer(fixOpRecord, false);

const OPS_FILE = 'ops.json';

export const serverOpsFile: ServerSettingFile<Ops> = {
  async load(cwdPath) {
    const filePath = cwdPath.child(OPS_FILE);

    // ファイルが存在しない場合空リストを返す
    if (!filePath.exists()) return [];

    const value = await filePath.readJson<Ops>();
    if (isError(value)) return value;
    const fixed = fixOps(value);
    if (fixed === FAIL)
      return errorMessage.data.path.invalidContent.invalidOpsJson({
        type: 'file',
        path: filePath.path,
      });
    return fixed;
  },
  save(cwdPath, value) {
    return cwdPath.child(OPS_FILE).writeText(JSON.stringify(value));
  },
  path(cwdPath) {
    return cwdPath.child(OPS_FILE);
  },
};
