import { Path } from '../utils/path/path';

export const mainPath = new Path('server');
export const worldsPath = mainPath.child('worlds');

export const runtimePath = mainPath.child('bin/runtime');
export const versionsPath = mainPath.child('versions');

export const versionManifestPath = versionsPath.child(
  'vanilla/version_manifest_v2.json'
);

export const spigotBuildPath = mainPath.child('spigotBuild');
