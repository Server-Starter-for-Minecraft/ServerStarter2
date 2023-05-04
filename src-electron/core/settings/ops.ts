import { OpLevel } from 'app/src-electron/schema/ops';
import { ServerSettingHandler } from './base';

export type OpRecord = {
  uuid: string;
  name: string;
  level: OpLevel;
  bypassesPlayerLimit: false;
};

export type Ops = OpRecord[];

const FILENAME = 'ops.json';

const MESSAGE =
  '"このファイルは使用されません。op権限の書き換えはServerStarter本体から行ってください。"';

export const opsHandler: ServerSettingHandler<Ops> = {
  load(cwdPath) {
    return cwdPath.child(FILENAME).readJson<Ops>();
  },
  save(cwdPath, value) {
    return cwdPath.child(FILENAME).writeText(JSON.stringify(value));
  },
  remove(cwdPath) {
    return cwdPath.child(FILENAME).writeText(MESSAGE);
  },
};
