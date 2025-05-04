import { z } from 'zod';
import { ServerSettingFile } from '../../world/files/base';

export const BannedIp = z.object({
  ip: z.string(),
  created: z.string(),
  source: z.string(),
  expires: z.string(),
  reason: z.string(),
});
export type BannedIp = z.infer<typeof BannedIp>;

// e.g.
// {
//   ip: '142.251.222.3';
//   created: '2023-05-04 05:12:40 +0900';
//   source: 'Server';
//   expires: 'forever';
//   reason: 'Banned by an operator.';
// };

export const BannedIps = z.array(BannedIp);
export type BannedIps = z.infer<typeof BannedIps>;

const FILENAME = 'banned-ips.json';

export const bannedIpsHandler: ServerSettingFile<BannedIps> = {
  load(cwdPath) {
    return cwdPath.child(FILENAME).readJson(BannedIps);
  },
  save(cwdPath, value) {
    return cwdPath.child(FILENAME).writeText(JSON.stringify(value));
  },
  path(cwdPath) {
    return cwdPath.child(FILENAME);
  },
};
