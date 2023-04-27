import { app } from 'electron';
import { Path } from '../util/path';

const userDataPath = new Path(
  app?.getPath('userData') ?? 'userData'
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
