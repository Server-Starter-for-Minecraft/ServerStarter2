import { runtimePath } from '../../core/const';
import { config } from '../../core/stores/config';
import { BytesData } from '../bytesData';
import { osPlatform } from '../os';
import { Path } from '../path';
import { Failable } from '../error/failable';
import { installManifest, Manifest } from './manifest';
import { fromRuntimeError, isError } from '../error/error';

export type component =
  | 'java-runtime-alpha'
  | 'java-runtime-beta'
  | 'java-runtime-gamma'
  | 'jre-legacy';

/**
 * 適切なjavaw.exeの実行パスを返す
 * 必要に応じてバイナリをダウンロードする
 */
export async function readyJava(
  component: component,
  javaw: boolean
): Promise<Failable<Path>> {
  const json = await getAllJson();

  if (isError(json)) return json;

  const manifest = json[osPlatform][component][0].manifest;

  const path = runtimePath.child(`${component}/${osPlatform}`);
  const data = await getManifestJson(manifest, path.child('manifest.json'));
  await installManifest(data, path);
  switch (osPlatform) {
    case 'windows-x64':
      return javaw ? path.child('bin/javaw.exe') : path.child('bin/java.exe');
    case 'linux':
      return path.child('bin/java');
    case 'mac-os':
    case 'mac-os-arm64':
      return path.child('jre.bundle/Contents/Home/bin/java');
    default:
      throw new Error(`Unknown OS:${osPlatform}`);
  }
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
    const data = await BytesData.fromUrlOrPath(
      runtimePath.child('all.json'),
      'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json',
      allJsonSha1 !== undefined
        ? { type: 'sha1', value: allJsonSha1 }
        : allJsonSha1,
      true
    );

    if (isError(data)) return data;

    const json = await data.json<AllJson>();
    if (isError(json)) return json;
    return json;
  } catch (e) {
    return fromRuntimeError(e);
  }
}

async function getManifestJson(
  manifest: RuntimeManifest,
  path: Path
): Promise<Failable<any>> {
  const data = await BytesData.fromUrlOrPath(
    path,
    manifest.url,
    {
      type: 'sha1',
      value: manifest.sha1,
    },
    true
  );
  if (isError(data)) return data;

  const json = await data.json<Manifest>();
  if (isError(json)) return json;

  return json;
}
