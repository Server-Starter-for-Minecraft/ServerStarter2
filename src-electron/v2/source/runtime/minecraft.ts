import { z } from 'zod';
import { OsPlatform } from '../../schema/os';
import { MinecraftRuntime } from '../../schema/runtime';
import { err, ok, Result } from '../../util/base';
import { SHA256 } from '../../util/binary/hash';
import { Json } from '../../util/binary/json';
import { Path } from '../../util/binary/path';
import { Url } from '../../util/binary/url';
import { RuntimeInstaller, RuntimeMeta } from './base';
import { installManifest, ManifestFiles } from './manifest';

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
      new Json(ManifestFiles)
    );
    if (result.isErr) return result;
    const manifestFiles = result.value();

    await installManifest(installPath, manifestFiles);

    const runtimeFileNames = getRuntimeFileNames(osPlatform);

    const java = Object.keys(manifestFiles.files).find((k) =>
      k.endsWith(runtimeFileNames.java)
    );
    if (java === undefined) return err.error('MISSING JAVA RUNTIME FILE PATH');
    const javaSha256 = await installPath.child(java).into(SHA256);
    if (javaSha256.isErr) return javaSha256;

    const javaw = Object.keys(manifestFiles.files).find((k) =>
      k.endsWith(runtimeFileNames.javaw)
    );
    if (javaw === undefined)
      return err.error('MISSING JAVAW RUNTIME FILE PATH');
    const javawSha256 = await installPath.child(javaw).into(SHA256);
    if (javawSha256.isErr) return javawSha256;

    return ok({
      base: { path: installPath.toStr() },
      javaw: {
        path: installPath.child(java).toStr(),
        sha256: javaSha256.value(),
      },
      java: {
        path: installPath.child(javaw).toStr(),
        sha256: javawSha256.value(),
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
  const { test, expect } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');
  const path = await import('path');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child(
    'work',
    path.basename(__filename, '.ts')
  );
  workPath.mkdir();

  test(
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
}
