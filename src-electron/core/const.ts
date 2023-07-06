import { app } from 'electron';
import { Path } from '../util/path';
import { MemorySettings } from '../schema/memory';
import { WorldContainer } from '../schema/brands';
import { ServerProperties } from '../schema/serverproperty';
import * as server_properties from './world/files/properties';
import { objValueMap } from '../util/objmap';
import { Locale } from '../schema/system';
import { getDefaultLocalSavePath } from './user/savePath';

const userDataPath = (
  process.env.DEBUGGING || !app
    ? new Path('userData')
    : new Path(app?.getPath('userData'))
).absolute();

//const userDataPath = new Path('userData')

export const mainPath = userDataPath;

// writeFileSync('/Users/harutom/document/test.txt', mainPath.path+'\n' ,{
//   encoding: 'utf8',
//   flag: 'a+',
//   mode: 0o666,
//  });

export const cachePath = mainPath.child('cache');

export const runtimePath = cachePath.child('bin/runtime');
export const versionsCachePath = cachePath.child('versions');

export const versionManifestPath = versionsCachePath.child(
  'vanilla/version_manifest_v2.json'
);

export const tempPath = mainPath.child('temp');

/** spigotをビルドするためのキャッシュパス */
export const spigotBuildPath = cachePath.child('spigotBuild');

/** zipファイルを展開するための一時パス */
export const unzipPath = tempPath.child('zip');

export const LEVEL_NAME = 'world' as const;

export const PLUGIN_NETHER_LEVEL_NAME = 'world_nether' as const;
export const PLUGIN_THE_END_LEVEL_NAME = 'world_the_end' as const;

export const DEFAULT_MEMORY: MemorySettings = {
  size: 2,
  unit: 'GB',
} as const;

export const DEFAULT_LOCALE: Locale = 'ja';

export const NEW_WORLD_NAME = 'NewWorld';

export const DEFAULT_SERVER_PROPERTIES: ServerProperties = objValueMap(
  server_properties.annotations,
  (x) => x.default
);

export const DEFAULT_WORLD_CONTAINER = 'servers' as WorldContainer;

export const WORLDNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export const DEFAULT_LOCAL_SAVE_CONTAINER = getDefaultLocalSavePath();
