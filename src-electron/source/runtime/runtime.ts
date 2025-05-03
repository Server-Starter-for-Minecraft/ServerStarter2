import { GroupProgressor } from 'app/src-electron/common/progress';
import { OsPlatform } from 'app/src-electron/schema/os';
import { BytesData } from '../../util/binary/bytesData';
import { Path } from '../../util/binary/path';
import { fromRuntimeError, isError } from '../../util/error/error';
import { Failable } from '../../util/error/failable';
import { osPlatform } from '../../util/os/os';
import { runtimePath } from '../const';
import { versionConfig } from '../stores/config';

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
  javaw: boolean,
  progress?: GroupProgressor
): Promise<Failable<Path>> {
  progress?.title({
    key: 'server.readyJava.title',
  });

  const json = await getAllJson();

  const allJsonKeyOsPlatformMap: Record<OsPlatform, keyof AllJson> = {
    debian: 'linux',
    redhat: 'linux',
    'mac-os': 'mac-os',
    'mac-os-arm64': 'mac-os-arm64',
    'windows-x64': 'windows-x64',
  };

  if (isError(json)) return json;

  const manifest =
    json[allJsonKeyOsPlatformMap[osPlatform]][component][0].manifest;

  const path = runtimePath.child(`${component}/${osPlatform}`);

  const data = await getManifestJson(manifest, path.child('manifest.json'));

  await installManifest(data, path, progress);

  switch (osPlatform) {
    case 'windows-x64':
      return javaw ? path.child('bin/javaw.exe') : path.child('bin/java.exe');
    case 'debian':
    case 'redhat':
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
    const allJsonSha1 = versionConfig.get('sha1')?.runtime;
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

//
// # source util/java/manifest.ts
//

type Manifest = {
  files: {
    [key in string]: ManifestFile | ManifestDirectory | ManifestLink;
  };
};

type ManifestDownload = {
  sha1: string;
  size: number;
  url: string;
};

type ManifestFile = {
  downloads: {
    lzma?: ManifestDownload;
    raw: ManifestDownload;
  };
  executable: boolean;
  type: 'file';
};
type ManifestDirectory = { type: 'directory' };
type ManifestLink = { target: string; type: 'link' };

/** manifest.jsonに記載されているデータをローカルに展開する */
async function installManifest(
  manifest: Manifest,
  path: Path,
  progress?: GroupProgressor
) {
  // 展開先の親ディレクトリを生成
  await path.mkdir(true);

  // manifestの順番でファイル/ディレクトリ/リンクを作る
  // ディレクトリは同期的に作成し、ファイル/リンクは非同期を並列して処理
  const promises: Promise<Failable<undefined>>[] = [];
  const entries = Object.entries(manifest.files);
  let processed = 0;

  const numeric = progress?.numeric('file', entries.length);
  const file = progress?.subtitle({
    key: 'server.readyJava.file',
    args: {
      path: '',
    },
  });

  for await (const [k, v] of entries) {
    const p = path.child(k);
    switch (v.type) {
      case 'file':
        const filePromise = async () => {
          file?.setSubtitle({
            key: 'server.readyJava.file',
            args: { path: k },
          });
          const result = await BytesData.fromPathOrUrl(
            p,
            v.downloads.raw.url,
            { value: v.downloads.raw.sha1, type: 'sha1' },
            false,
            undefined,
            v.executable
          );
          numeric?.setValue(processed++);
          if (isError(result)) return result;
        };
        promises.push(filePromise());
        break;
      case 'directory':
        file?.setSubtitle({
          key: 'server.readyJava.file',
          args: { path: k },
        });
        await p.mkdir();
        numeric?.setValue(processed++);
        break;
      case 'link':
        const linkPromise = async () => {
          file?.setSubtitle({
            key: 'server.readyJava.file',
            args: { path: k },
          });
          await p.mklink(p.parent().child(v.target));
          numeric?.setValue(processed++);
          return undefined;
        };
        promises.push(linkPromise());
        break;
    }
  }
  // ファイル/リンクの並列処理を待機
  await Promise.all(promises);
  // TODO: Failureがあった場合の処理
}
