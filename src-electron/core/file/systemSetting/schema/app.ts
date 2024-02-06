import { fixConst } from '../../base/fixer/const';
import { fixObject } from '../../base/fixer/object';
import { ContainersSettings$1 } from './container';
import { PlayerSettings$1, defaultPlayerSettings$1 } from './player';
import { RemoteSettings$1 } from './remote';
import { SystemSettings$1 } from './system';
import { UserSettings$1, defaultUserSettings$1 } from './user';
import { WorldSettings$1, defaultWorldSettings$1 } from './world';

/** システム設定まとめてここに格納 */
export type AppSettings$1 = {
  // スキーマバージョン
  __ver__: 1;
  container: ContainersSettings$1;
  world: WorldSettings$1;
  remote: RemoteSettings$1;
  player: PlayerSettings$1;
  user: UserSettings$1;
  system: SystemSettings$1;
};

export const AppSettings$1 = fixObject<AppSettings$1>({
  // スキーマバージョン
  __ver__: fixConst(1),
  container: ContainersSettings$1,
  world: WorldSettings$1,
  remote: RemoteSettings$1,
  player: PlayerSettings$1,
  user: UserSettings$1,
  system: SystemSettings$1,
}).default({
  __ver__: 1,
  container: [],
  world: defaultWorldSettings$1,
  remote: [],
  player: defaultPlayerSettings$1,
  user: defaultUserSettings$1,
  system: {},
});
