import { ServerSettingHandler } from './base';

export type OpRecord = {
  uuid: string;
  name: string;
  level: 4;
  bypassesPlayerLimit: false;
};

export type Ops = OpRecord[];

const FILENAME = 'ops.json';

export const opsHandler: ServerSettingHandler<Ops> = {
  load(cwdPath) {
    return cwdPath.child(FILENAME).readJson<Ops>();
  },
  save(cwdPath, value) {
    return cwdPath.child(FILENAME).writeText(JSON.stringify(value));
  },
  remove(cwdPath) {
    return cwdPath.child(FILENAME).remove();
  },
};
