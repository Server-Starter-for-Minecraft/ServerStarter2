import { fixConst } from '../base/fixer/const';
import { fixObject } from '../base/fixer/object';
import {
  AppContainersSettings$1,
  defaultAppContainersSettings$1,
} from './container';
import { AppPlayerSettings$1, defaultAppPlayerSettings$1 } from './player';
import { AppRemoteSettings$1 } from './remote';
import { AppSystemSettings$1 } from './system';
import { AppUserSettings$1, defaultAppUserSettings$1 } from './user';
import { AppWorldSettings$1, defaultAppWorldSettings$1 } from './world';

// スキーマ設定前のやつ
export type AppSettings$0 = {
  container: AppContainersSettings$1;
  world: AppWorldSettings$1;
  remote: AppRemoteSettings$1;
  player: AppPlayerSettings$1;
  user: AppUserSettings$1;
  system: AppSystemSettings$1;
};

// スキーマ設定前のやつ
export const AppSettings$0 = fixObject<AppSettings$0>({
  container: AppContainersSettings$1,
  world: AppWorldSettings$1,
  remote: AppRemoteSettings$1,
  player: AppPlayerSettings$1,
  user: AppUserSettings$1,
  system: AppSystemSettings$1,
});

function upgradeAppSettings$0$1(old: AppSettings$0): AppSettings$1 {
  return { __ver__: 1, ...old };
}

/** システム設定まとめてここに格納 */
export type AppSettings$1 = {
  // スキーマバージョン
  __ver__: 1;
  container: AppContainersSettings$1;
  world: AppWorldSettings$1;
  remote: AppRemoteSettings$1;
  player: AppPlayerSettings$1;
  user: AppUserSettings$1;
  system: AppSystemSettings$1;
};

export const defualtAppSettings$1: AppSettings$1 = {
  __ver__: 1,
  container: defaultAppContainersSettings$1,
  world: defaultAppWorldSettings$1,
  remote: [],
  player: defaultAppPlayerSettings$1,
  user: defaultAppUserSettings$1,
  system: {},
};

export const AppSettings$1 = fixObject<AppSettings$1>({
  // スキーマバージョン
  __ver__: fixConst(1),
  container: AppContainersSettings$1,
  world: AppWorldSettings$1,
  remote: AppRemoteSettings$1,
  player: AppPlayerSettings$1,
  user: AppUserSettings$1,
  system: AppSystemSettings$1,
})
  .or(AppSettings$0.map(upgradeAppSettings$0$1))
  .default(defualtAppSettings$1);
