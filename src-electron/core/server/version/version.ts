import { Version } from 'app/src-electron/api/scheme';
import { readyVanillaVersion } from './vanilla';
import { versionsPath } from '../const';

// 指定されたバージョンを準備する
export async function readyVersion(version: Version) {
  switch (version.type) {
    case 'vanilla':
      return await readyVanillaVersion(versionsPath.child('vanilla'), version);
    default:
      throw new Error(`unknown version ${version.id}(${version.type})`);
  }
}
