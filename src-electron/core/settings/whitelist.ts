import { ServerSettingHandler } from './base';

export type WhitelistRecord = {
  uuid: string;
  name: string;
};

export type Whitelist = WhitelistRecord[];

const FILENAME = 'whitelist.json';

export const whitelistHandler: ServerSettingHandler<Whitelist> = {
  load(cwdPath) {
    return cwdPath.child(FILENAME).readJson<Whitelist>();
  },
  save(cwdPath, value) {
    return cwdPath.child(FILENAME).writeText(JSON.stringify(value));
  },
  remove(cwdPath) {
    return cwdPath.child(FILENAME).remove();
  },
};
