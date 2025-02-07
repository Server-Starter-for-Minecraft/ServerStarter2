import { ServerSettingFile } from '../../world/files/base';

export type BannedPlayer = {
  uuid: string;
  name: string;
  created: string;
  source: string;
  expires: string;
  reason: string;
};

// e.g.
// {
//   "uuid": "xxx",
//   "name": "xxx",
//   "created": "2023-05-04 05:06:05 +0900",
//   "source": "Server",
//   "expires": "forever",
//   "reason": "Banned by an operator."
// }

export type BannedPlayers = BannedPlayer[];

const FILENAME = 'banned-players.json';

export const bannedPlayersHandler: ServerSettingFile<BannedPlayers> = {
  load(cwdPath) {
    return cwdPath.child(FILENAME).readJson<BannedPlayers>();
  },
  save(cwdPath, value) {
    return cwdPath.child(FILENAME).writeText(JSON.stringify(value));
  },
  remove(cwdPath) {
    return cwdPath.child(FILENAME).remove();
  },
};
