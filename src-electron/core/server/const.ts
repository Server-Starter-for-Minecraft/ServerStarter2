import { userDataPath } from '../userDataPath';

export const mainPath = userDataPath;

export const runtimePath = mainPath.child('bin/runtime');
export const versionsPath = mainPath.child('versions');

export const versionManifestPath = versionsPath.child(
  'vanilla/version_manifest_v2.json'
);

export const spigotBuildPath = mainPath.child('spigotBuild');
