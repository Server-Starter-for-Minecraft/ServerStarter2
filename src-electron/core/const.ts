import { app } from 'electron';
import { Path } from '../util/path';

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

export const LEVEL_NAME = 'world';
