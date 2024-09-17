import { z } from 'zod';
import { OsPlatform } from '../../schema/os';
import { MinecraftRuntime } from '../../schema/runtime';
import { err, ok, Result } from '../../util/base';
import { SHA256 } from '../../util/binary/hash';
import { Json } from '../../util/binary/json';
import { Path } from '../../util/binary/path';
import { Url } from '../../util/binary/url';
import { RuntimeInstaller, RuntimeMeta } from './base';
import { installManifest, ManifestContent, ManifestFile } from './manifest';

const allManifestUrl = new Url(
  'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json'
);

export class MinecraftRuntimeInstaller
  implements RuntimeInstaller<MinecraftRuntime>
{
  private manifestPath: Path;

  constructor(manifestPath: Path) {
    this.manifestPath = manifestPath;
  }

  async install(
    installPath: Path,
    runtime: MinecraftRuntime,
    osPlatform: OsPlatform
  ): Promise<Result<RuntimeMeta>> {
    const manifestJson = new Json(AllManifest);

    // allManifestJsonの内容をファイルにキャッシュしつつ取得
    let allManifest = await this.manifestPath.into(manifestJson);
    if (allManifest.isErr) {
      await allManifestUrl.into(this.manifestPath);
      allManifest = await this.manifestPath.into(manifestJson);
      if (allManifest.isErr) return allManifest;
    }

    const osNameMap = {
      debian: 'linux',
      redhat: 'linux',
      'mac-os': 'mac-os',
      'mac-os-arm64': 'mac-os-arm64',
      'windows-x64': 'windows-x64',
    } as const;

    const osManifest =
      allManifest.value()[osNameMap[osPlatform]][runtime.version];

    if (osManifest === undefined) return err.error('missing manifest');
    if (osManifest.length === 0) return err.error('missing manifest');

    const result = await new Url(osManifest[0].manifest.url).into(
      new Json(ManifestContent)
    );
    if (result.isErr) return result;
    const manifestFiles = result.value();

    await installManifest(installPath, manifestFiles);

    const runtimeFileNames = getRuntimeFileNames(osPlatform);

    const java = Object.entries(manifestFiles.files).find(
      ([k, value]) => k.endsWith(runtimeFileNames.java) && value.type === 'file'
    ) as [string, ManifestFile];
    if (java === undefined) return err.error('MISSING JAVA RUNTIME FILE PATH');

    const javaw = Object.entries(manifestFiles.files).find(
      ([k, value]) =>
        k.endsWith(runtimeFileNames.javaw) && value.type === 'file'
    ) as [string, ManifestFile];
    if (javaw === undefined)
      return err.error('MISSING JAVAW RUNTIME FILE PATH');

    return ok({
      base: { path: installPath.toStr() },
      javaw: {
        path: installPath.child(java[0]).toStr(),
        sha1: java[1].downloads.raw.sha1,
      },
      java: {
        path: installPath.child(javaw[0]).toStr(),
        sha1: javaw[1].downloads.raw.sha1,
      },
    });
  }

  getInstallPath(
    installBasePath: Path,
    runtime: MinecraftRuntime,
    osPlatform: OsPlatform
  ): Path {
    return installBasePath.child('minecraft', runtime.version, osPlatform);
  }
}

function getRuntimeFileNames(osPlatform: OsPlatform) {
  switch (osPlatform) {
    case 'windows-x64':
      return { java: 'java.exe', javaw: 'javaw.exe' };
    case 'mac-os':
    case 'mac-os-arm64':
      return { java: 'java', javaw: 'java' };
    case 'debian':
    case 'redhat':
      return { java: 'java', javaw: 'java' };
  }
}

const Manifest = z.object({
  manifest: z.object({
    sha1: z.string(),
    size: z.number(),
    url: z.string(),
  }),
});

const OsManifest = z.record(z.string(), z.array(Manifest).optional());

const AllManifest = z.object({
  linux: OsManifest,
  'mac-os': OsManifest,
  'mac-os-arm64': OsManifest,
  'windows-x64': OsManifest,
  'windows-arm64': OsManifest,
});

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;
  describe('', async () => {
    const { Path } = await import('src-electron/v2/util/binary/path');
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    workPath.mkdir();

    test.skip(
      'minecraft',
      async () => {
        const minecraft = new MinecraftRuntimeInstaller(
          workPath.child('01', 'cache')
        );

        const installResult = await minecraft.install(
          workPath.child('01', 'java-runtime-alpha'),
          {
            type: 'minecraft',
            version: 'java-runtime-alpha',
          },
          'windows-x64'
        );
        expect(installResult.isOk).toBe(true);
      },
      1000 * 1000
    );
  });
}
