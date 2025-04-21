import { ServerSettingFile } from '../../world/files/base';

export type BannedIp = {
  ip: string;
  created: string;
  source: string;
  expires: string;
  reason: string;
};

// e.g.
// {
//   ip: '142.251.222.3';
//   created: '2023-05-04 05:12:40 +0900';
//   source: 'Server';
//   expires: 'forever';
//   reason: 'Banned by an operator.';
// };

export type BannedIps = BannedIp[];

const FILENAME = 'banned-ips.json';

export const bannedIpsHandler: ServerSettingFile<BannedIps> = {
  load(cwdPath) {
    return cwdPath.child(FILENAME).readJson<BannedIps>();
  },
  save(cwdPath, value) {
    return cwdPath.child(FILENAME).writeText(JSON.stringify(value));
  },
  path(cwdPath) {
    return cwdPath.child(FILENAME);
  },
};
