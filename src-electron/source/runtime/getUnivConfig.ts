import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { OsPlatform } from 'app/src-electron/schema/os';
import {
  JavaComponent,
  JavaMajorVersion,
  Runtime,
  UniversalRuntime,
} from 'app/src-electron/schema/runtime';
import { errorMessage } from 'app/src-electron/util/error/construct';

// betaとgammaはメジャーバージョンが共に17のため，より新しいgammaを優先する
const McTargetComponent = JavaComponent.exclude(['java-runtime-beta']);
type McTargetComponent = z.infer<typeof McTargetComponent>;

// minecraft のランタイムに基づいてコンポーネント名を返却する
const McConfig = z.record(OsPlatform, z.record(z.number(), McTargetComponent));
type McConfig = z.infer<typeof McConfig>;

// debian, redhatはlinuxから取得
const mcConfig: McConfig = {
  debian: {
    16: 'java-runtime-alpha',
    21: 'java-runtime-delta',
    17: 'java-runtime-gamma',
    8: 'jre-legacy',
  },
  redhat: {
    16: 'java-runtime-alpha',
    21: 'java-runtime-delta',
    17: 'java-runtime-gamma',
    8: 'jre-legacy',
  },
  'mac-os': {
    16: 'java-runtime-alpha',
    17: 'java-runtime-gamma',
    21: 'java-runtime-delta',
    8: 'jre-legacy',
  },
  'mac-os-arm64': {
    21: 'java-runtime-delta',
    17: 'java-runtime-gamma',
  },
  'windows-x64': {
    16: 'java-runtime-alpha',
    17: 'java-runtime-gamma',
    21: 'java-runtime-delta',
    8: 'jre-legacy',
  },
};

/**
 * Java17のような一般バージョン番号から「'java-runtime-gamma'」のようなコンポーネント名を返す
 *
 * `majorVersion`が指定されていない場合は、最新のランタイムを返す
 *
 * TODO: OuterResourceからの取得に差替える
 * TODO: MinecraftランタイムからCorrettoに差替える（フォールバックにする？）
 */
export function getUniversalConfig(
  osPlatform: OsPlatform,
  majorVersion?: JavaMajorVersion
): Promise<Failable<Exclude<Runtime, UniversalRuntime>>> {
  let version;
  if (majorVersion) {
    version = majorVersion;
  } else {
    version = Math.max(
      ...Object.keys(mcConfig[osPlatform] ?? { 0: 'undefined' }).map(Number)
    );
  }

  const runtimeComponentName = mcConfig[osPlatform]?.[version];
  if (runtimeComponentName) {
    return Promise.resolve({
      type: 'minecraft',
      version: runtimeComponentName,
    });
  } else {
    return Promise.resolve(
      errorMessage.core.runtime.installFailed({
        runtimeType: 'universal',
        targetOs: osPlatform,
        version: version.toString(),
      })
    );
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('check runtime universal versions', async () => {
    const { BytesData } = await import('../../util/binary/bytesData');
    const { isError } = await import('../../util/error/error');
    const { fromEntries } = await import('../../util/obj/obj');
    const { McRuntimeManifest } = await import('../../schema/runtime');

    const targetUrl =
      'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json';

    // URLの内容を取得
    const targetManifestBytes = await BytesData.fromURL(targetUrl);
    expect(isError(targetManifestBytes)).toBeFalsy();
    if (isError(targetManifestBytes)) return targetManifestBytes;
    const manifestJson = await targetManifestBytes.json(McRuntimeManifest);
    expect(isError(manifestJson)).toBeFalsy();
    if (isError(manifestJson)) return manifestJson;

    // 検証用データに整形
    const cleanConfig = (obj: Record<string, any>) => {
      const runtimeComponentName = Object.keys(obj).filter(
        (k) =>
          McTargetComponent.safeParse(k).success && (obj[k]?.length ?? 0 > 0)
      );
      return fromEntries(
        runtimeComponentName.map((n) => [
          obj[n]?.[0].version.name?.match(/^(\d+)/)?.[1] ?? 'undefined',
          n,
        ])
      );
    };
    const linuxConfig = cleanConfig(manifestJson.linux);
    const macConfig = cleanConfig(manifestJson['mac-os']);
    const mac64Config = cleanConfig(manifestJson['mac-os-arm64']);
    const winConfig = cleanConfig(manifestJson['windows-x64']);

    // システム内で利用しているデータが最新か確認する
    // 最新でない場合はここのテストで失敗するため，失敗内容に合わせて上記ハードコードを修正
    expect({
      debian: linuxConfig,
      redhat: linuxConfig,
      'mac-os': macConfig,
      'mac-os-arm64': mac64Config,
      'windows-x64': winConfig,
    }).toEqual(mcConfig);
  });
}
