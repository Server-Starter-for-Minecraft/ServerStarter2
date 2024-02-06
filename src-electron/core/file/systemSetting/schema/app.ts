import { fixConst } from '../../base/fixer/const';
import { fixObject } from '../../base/fixer/object';
import { ContainersSettings$1 } from './container';
import { PlayerSettings$1, defaultPlayerSettings$1 } from './player';
import { RemoteSettings$1 } from './remote';
import { SystemSettings$1 } from './system';
import { UserSettings$1, defaultUserSettings$1 } from './user';
import { WorldSettings$1, defaultWorldSettings$1 } from './world';

// スキーマ設定前のやつ
export type AppSettings$0 = {
  container: ContainersSettings$1;
  world: WorldSettings$1;
  remote: RemoteSettings$1;
  player: PlayerSettings$1;
  user: UserSettings$1;
  system: SystemSettings$1;
};

// スキーマ設定前のやつ
export const AppSettings$0 = fixObject<AppSettings$0>({
  container: ContainersSettings$1,
  world: WorldSettings$1,
  remote: RemoteSettings$1,
  player: PlayerSettings$1,
  user: UserSettings$1,
  system: SystemSettings$1,
}).default({
  container: [],
  world: defaultWorldSettings$1,
  remote: [],
  player: defaultPlayerSettings$1,
  user: defaultUserSettings$1,
  system: {},
});

function upgradeAppSettings$0$1(old: AppSettings$0): AppSettings$1 {
  return { __ver__: 1, ...old };
}

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

const defualtAppSettings$1: AppSettings$1 = {
  __ver__: 1,
  container: [],
  world: defaultWorldSettings$1,
  remote: [],
  player: defaultPlayerSettings$1,
  user: defaultUserSettings$1,
  system: {},
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
}).or(AppSettings$0.map(upgradeAppSettings$0$1));
