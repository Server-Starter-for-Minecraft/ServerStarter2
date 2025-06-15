import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { OsPlatform } from 'app/src-electron/schema/os';
import {
  JavaComponent,
  JavaMajorVersion,
  McRuntimeManifest,
  Runtime,
  UniversalRuntime,
} from 'app/src-electron/schema/runtime';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { fromEntries, toEntries } from '../../util/obj/obj';

// betaとgammaはメジャーバージョンが共に17のため，より新しいgammaを優先する
const EXCLUDE_COMPONENTS = ['java-runtime-beta'] as const;
const McTargetComponent = JavaComponent.exclude(EXCLUDE_COMPONENTS);
type McTargetComponent = z.infer<typeof McTargetComponent>;

// minecraft のランタイムに基づいてコンポーネント名を返却する
const McRuntimeComponent = z.record(z.number(), McTargetComponent);
type McRuntimeComponent = z.infer<typeof McRuntimeComponent>;
const McRuntimeComponents = z.record(OsPlatform, McRuntimeComponent);
type McRuntimeComponents = z.infer<typeof McRuntimeComponents>;

/**
 * 対応している全OSに対して，一般的なバージョン番号からコンポーネント名の対応関係を生成
 */
function getConvertersJdk2Component(
  mcRuntimeManifest: McRuntimeManifest
): McRuntimeComponents {
  // URLから取得した生データであるMcRuntimeManifestを
  // JDKバージョンとコンポーネント名を紐づけたオブジェクトに変換
  const configEntries: [string, McRuntimeComponent][] = toEntries(
    mcRuntimeManifest
  ).map(([os, config]) => {
    const vers = toEntries(config)
      .map(([componentName, obj]): [number, McTargetComponent] | undefined => {
        if (!obj || obj.length === 0) return undefined;
        if (EXCLUDE_COMPONENTS.some((c) => c === componentName))
          return undefined;
        const majorVersion = parseInt(obj[0].version.name.split('.')[0]);
        const targetComponent = McTargetComponent.safeParse(componentName);
        if (!targetComponent.success) return undefined;
        return [majorVersion, targetComponent.data];
      })
      .filter((o) => o !== undefined);
    return [os, fromEntries(vers)];
  });
  const tmpResult = fromEntries(configEntries);

  // linuxはすべて同じ
  tmpResult['redhat'] = tmpResult['linux'];
  tmpResult['debian'] = tmpResult['linux'];
  delete tmpResult['linux'];

  // TODO: 下記を削除してWindows-arm64に対応する & OsPlatformの型定義を変更
  delete tmpResult['windows-arm64'];

  return tmpResult;
}

/**
 * 指定されたバージョンが存在しない場合に、利用可能な最も近い（小さい側の）バージョンを取得する
 */
function findNearestLowerVersion(
  availableVersions: McRuntimeComponent | undefined,
  targetVersion: number
): McTargetComponent | undefined {
  if (!availableVersions) return undefined;

  // 降順でソート
  const sortedVersions = toEntries(availableVersions).sort(
    (a, b) => b[0] - a[0]
  );

  // 指定されたバージョン以下で最も大きいバージョンを探す
  for (const version of sortedVersions) {
    if (version[0] <= targetVersion) {
      return version[1];
    }
  }

  // 指定されたバージョンより小さいものがない場合は undefined を返す
  return undefined;
}

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
  mcRuntimeManifest: McRuntimeManifest,
  majorVersion: JavaMajorVersion | undefined
): Promise<Failable<Exclude<Runtime, UniversalRuntime>>> {
  const converters = getConvertersJdk2Component(mcRuntimeManifest);

  // versionがconvertersに存在しない場合は小さい側の直近のバージョンを表示する
  // majorVersionが指定されていない場合は最新のバージョンを表示する
  const runtimeComponentName = findNearestLowerVersion(
    converters[osPlatform],
    majorVersion ?? 10 ** 3
  );
  if (runtimeComponentName) {
    return Promise.resolve({
      type: 'minecraft',
      version: runtimeComponentName,
    });
  } else {
    // TODO: 「/path/to/install にインストールしてください」というエラーメッセージに変更
    return Promise.resolve(
      errorMessage.core.runtime.installFailed({
        runtimeType: 'universal',
        targetOs: osPlatform,
        version: majorVersion?.toString() ?? 'LATEST RUNTIME VERSION',
      })
    );
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('getUniversalConfig', async () => {
    const { BytesData } = await import('../../util/binary/bytesData');
    const { isError } = await import('../../util/error/error');
    const { minecraftRuntimeManifestUrl } = await import('./minecraft');

    const bytesManifest = await BytesData.fromURL(minecraftRuntimeManifestUrl);
    if (isError(bytesManifest)) return;
    const mcRuntimeManifest = await bytesManifest.json(McRuntimeManifest);
    if (isError(mcRuntimeManifest)) return;

    test('getUniversalConfig', async () => {
      // get Java17
      const runtime1 = await getUniversalConfig(
        'windows-x64',
        mcRuntimeManifest,
        JavaMajorVersion.parse(17)
      );
      expect(isError(runtime1)).toBeFalsy();
      expect(runtime1).toEqual({
        type: 'minecraft',
        version: 'java-runtime-gamma',
      });
      // get Java21 (Converted from Java23)
      const runtime2 = await getUniversalConfig(
        'windows-x64',
        mcRuntimeManifest,
        JavaMajorVersion.parse(23)
      );
      expect(isError(runtime2)).toBeFalsy();
      expect(runtime2).toEqual({
        type: 'minecraft',
        version: 'java-runtime-delta',
      });
    });

    test('check runtime universal versions', async () => {
      const { fromEntries } = await import('../../util/obj/obj');

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
      const linuxConfig = cleanConfig(mcRuntimeManifest.linux);
      const macConfig = cleanConfig(mcRuntimeManifest['mac-os']);
      const mac64Config = cleanConfig(mcRuntimeManifest['mac-os-arm64']);
      const winConfig = cleanConfig(mcRuntimeManifest['windows-x64']);

      // Manifestデータが正常に必要なObjectに変換されることを確認
      expect(getConvertersJdk2Component(mcRuntimeManifest)).toEqual({
        debian: linuxConfig,
        redhat: linuxConfig,
        'mac-os': macConfig,
        'mac-os-arm64': mac64Config,
        'windows-x64': winConfig,
      });
    });
  });
}
