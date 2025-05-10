// import { datapackSourcePath, serverSourcePath } from '../common/paths';
import { runtimePath, versionsCachePath } from '../source/const';
import { getUniversalConfig } from '../source/runtime/getUnivConfig';
import { RuntimeContainer } from '../source/runtime/runtime';
import { VersionContainer } from '../source/version/version';

// import { DatapackContainer } from '../source/datapack/datapack';
// import { ServerContainer } from '../source/server/server';

/**
 * coreが必要とするsourceの初期化を行う
 */

// export const datapackContainer = new DatapackContainer(datapackSourcePath);
// export const serverContainer = new ServerContainer(serverSourcePath);
export const runtimeContainer = new RuntimeContainer(
  runtimePath,
  getUniversalConfig
);
export const versionContainer = new VersionContainer(versionsCachePath);
