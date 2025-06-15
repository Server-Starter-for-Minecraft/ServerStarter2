import { Failable } from 'app/src-electron/schema/error';
import { ManifestContent } from 'app/src-electron/schema/manifest';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { OsPlatform } from '../../schema/os';
import { McRuntimeManifest, MinecraftRuntime } from '../../schema/runtime';
import { Path } from '../../util/binary/path';
import { JavaRuntimeInstaller } from './manifest';

export const minecraftRuntimeManifestUrl =
  'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json';

export class MinecraftRuntimeInstaller extends JavaRuntimeInstaller<
  McRuntimeManifest,
  MinecraftRuntime
> {
  static readonly manifestName = 'minecraft' as const;

  static setRuntimeManifest(
    manifestPath: Path,
    manifestUrl: string
  ): MinecraftRuntimeInstaller {
    return new MinecraftRuntimeInstaller(
      this.getCacheableAccessor(McRuntimeManifest, manifestPath, manifestUrl)
    );
  }

  getRuntimeVersion(runtime: MinecraftRuntime): string {
    return runtime.version;
  }

  protected async getManifestContent(
    manifest: McRuntimeManifest,
    runtime: MinecraftRuntime,
    osPlatForm: OsPlatform
  ): Promise<Failable<ManifestContent>> {
    // OSに対応するManifestのURLを取得
    const osNameMap = {
      debian: 'linux',
      redhat: 'linux',
      'mac-os': 'mac-os',
      'mac-os-arm64': 'mac-os-arm64',
      'windows-x64': 'windows-x64',
    } as const;
    const osManifest = manifest[osNameMap[osPlatForm]][runtime.version];
    if (osManifest === undefined || osManifest.length === 0) {
      return errorMessage.data.path.notFound({
        type: 'file',
        path: 'MISSING RUNTIME MANIFEST',
      });
    }

    // 取得したURLから内容を取得
    const targetManifestBytes = await BytesData.fromURL(
      osManifest[0].manifest.url
    );
    if (isError(targetManifestBytes)) return targetManifestBytes;
    return targetManifestBytes.json(ManifestContent);
  }

  protected getRuntimeFileNames(osPlatForm: OsPlatform): {
    java: string;
    javaw: string;
  } {
    switch (osPlatForm) {
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
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('minecraft runtime', async () => {
    const { Path } = await import('src-electron/util/binary/path');
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    test.skip(
      'minecraft',
      async () => {
        const minecraft = MinecraftRuntimeInstaller.setRuntimeManifest(
          workPath.child('all.json'),
          minecraftRuntimeManifestUrl
        );

        const installResult = await minecraft.install(
          workPath,
          {
            type: 'minecraft',
            version: 'java-runtime-gamma',
          },
          'windows-x64'
        );
        expect(!isError(installResult)).toBe(true);
      },
      1000 * 1000
    );
  });
}
