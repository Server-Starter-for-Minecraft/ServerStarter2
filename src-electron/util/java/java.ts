import { runtimePath } from '../../core/const.js';
import { config } from '../../core/stores/config.js';
import { BytesData } from '../bytesData.js';
import { osPlatform } from '../os.js';
import { Path } from '../path.js';
import { isFailure, Failable } from '../../api/failable.js';
import { installManifest, Manifest } from './manifest.js';

export type component =
  | 'java-runtime-alpha'
  | 'java-runtime-beta'
  | 'java-runtime-gamma'
  | 'jre-legacy';

export class JavaInstallError extends Error {}

/**
 * 適切なjavaw.exeの実行パスを返す
 * 必要に応じてバイナリをダウンロードする
 */
export async function readyJava(
  component: component,
  javaw: boolean
): Promise<Failable<Path>> {
  const json = await getAllJson();

  if (isFailure(json)) return json;

  const manifest = json[osPlatform][component][0].manifest;

  const path = runtimePath.child(`${component}/${osPlatform}`);
  const data = await getManifestJson(manifest, path.child('manifest.json'));
  await installManifest(data, path);

  return javaw ? path.child('bin/javaw.exe') : path.child('bin/java.exe');
}

type RuntimeManifest = {
  sha1: string;
  size: number;
  url: string;
};

type Runtime = {
  availability: { group: number; progress: 100 };
  manifest: RuntimeManifest;
  version: { name: string; released: string };
};

type Runtimes = {
  'java-runtime-alpha': Runtime[];
  'java-runtime-beta': Runtime[];
  'java-runtime-gamma': Runtime[];
  'jre-legacy': Runtime[];
  'minecraft-java-exe': Runtime[];
};

type AllJson = {
  gamecore: Runtimes;
  linux: Runtimes;
  'linux-i386': Runtimes;
  'mac-os': Runtimes;
  'mac-os-arm64': Runtimes;
  'windows-x64': Runtimes;
  'windows-x86': Runtimes;
};

async function getAllJson(): Promise<Failable<AllJson>> {
  try {
    const allJsonSha1 = config.get('sha1')?.runtime;
    const data = await BytesData.fromPathOrUrl(
      runtimePath.child('all.json'),
      'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json',
      allJsonSha1 !== undefined
        ? { type: 'sha1', value: allJsonSha1 }
        : allJsonSha1
    );

    if (isFailure(data)) return data;

    const json = await data.json<AllJson>();
    if (isFailure(json)) return json;
    return json;
  } catch (e) {
    // TODO:黒魔術
    return e as unknown as Error;
  }
}

async function getManifestJson(
  manifest: RuntimeManifest,
  path: Path
): Promise<Failable<any>> {
  const data = await BytesData.fromPathOrUrl(path, manifest.url, {
    type: 'sha1',
    value: manifest.sha1,
  });
  if (isFailure(data)) return data;

  const json = await data.json<Manifest>();
  if (isFailure(json)) return json;

  return json;
}
