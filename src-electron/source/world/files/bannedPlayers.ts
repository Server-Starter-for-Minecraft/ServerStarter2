import { z } from 'zod';
import { ServerSettingFile } from '../../world/files/base';

export const BannedPlayer = z.object({
  uuid: z.string(),
  name: z.string(),
  created: z.string(),
  source: z.string(),
  expires: z.string(),
  reason: z.string(),
});
export type BannedPlayer = z.infer<typeof BannedPlayer>;

// e.g.
// {
//   "uuid": "xxx",
//   "name": "xxx",
//   "created": "2023-05-04 05:06:05 +0900",
//   "source": "Server",
//   "expires": "forever",
//   "reason": "Banned by an operator."
// }

export const BannedPlayers = z.array(BannedPlayer);
export type BannedPlayers = z.infer<typeof BannedPlayers>;

const FILENAME = 'banned-players.json';

export const bannedPlayersHandler: ServerSettingFile<BannedPlayers> = {
  load(cwdPath) {
    return cwdPath.child(FILENAME).readJson(BannedPlayers);
  },
  save(cwdPath, value) {
    return cwdPath.child(FILENAME).writeText(JSON.stringify(value));
  },
  path(cwdPath) {
    return cwdPath.child(FILENAME);
  },
};
