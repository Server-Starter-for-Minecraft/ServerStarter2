import { Path } from '../utils/path/path';

export const mainPath = new Path('server');
export const worldsPath = mainPath.child('worlds');
export const serverCwdPath = mainPath.child('server');
export const runtimePath = mainPath.child('bin/runtime');
export const versionsPath = mainPath.child('versions');

export const versionManifestPath = mainPath.child('version_manifest_v2.json');
