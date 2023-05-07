import { app } from 'electron';
import { Path } from '../util/path';
import { MemorySettings } from '../schema/memory';
import { WorldContainer } from '../schema/brands';

const userDataPath = (
  process.env.DEBUGGING || !app
    ? new Path('userData')
    : new Path(app?.getPath('userData'))
).absolute();

export const mainPath = userDataPath;

export const cachePath = mainPath.child('cache');

export const runtimePath = mainPath.child('bin/runtime');
export const versionsCachePath = cachePath.child('versions');

export const versionManifestPath = versionsCachePath.child(
  'vanilla/version_manifest_v2.json'
);

export const spigotBuildPath = mainPath.child('spigotBuild');

export const LEVEL_NAME = 'world' as const;

export const DEFAULT_MEMORY: MemorySettings = {
  size: 2,
  unit: 'GB',
} as const;

export const DEFAULT_WORLD_CONTAINER = 'servers' as WorldContainer;

export const WORLDNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
