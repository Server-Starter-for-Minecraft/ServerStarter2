import { OsPlatform } from '../../schema/os';
import {
  JavaMajorVersion,
  Runtime,
  UniversalRuntime,
} from '../../schema/runtime';
import { err, ok, Result } from '../../util/base';
import { SHA1 } from '../../util/binary/hash';
import { Json } from '../../util/binary/json';
import { Path } from '../../util/binary/path';
import { RuntimeInstaller, RuntimeMeta } from './base';
import { MinecraftRuntimeInstaller } from './minecraft';

// 既存実装 -> src-electron\util\java\java.ts

const metaJson = new Json(RuntimeMeta);

export class RuntimeContainer {
  private cacheDirPath: Path;
  private metaDirPath: Path;
  private binDirPath: Path;
  private getUniversalConfig: (
    osPlatform: OsPlatform,
    majorVersion: JavaMajorVersion
  ) => Promise<Exclude<Runtime, UniversalRuntime>>;
  private installerMap: {
    [R in Exclude<Runtime, UniversalRuntime> as R['type']]: RuntimeInstaller<R>;
  };

  /**
   * @param getUniversalConfig universalのjavaの実体を返す OuterResourcesから取得する構成
   */
  constructor(
    cacheDirPath: Path,
    getUniversalConfig: (
      osPlatform: OsPlatform,
      majorVersion: JavaMajorVersion
    ) => Promise<Exclude<Runtime, UniversalRuntime>>
  ) {
    this.cacheDirPath = cacheDirPath;
    this.metaDirPath = cacheDirPath.child('meta');
    this.binDirPath = cacheDirPath.child('bin');
    this.getUniversalConfig = getUniversalConfig;

    this.installerMap = {
      minecraft: new MinecraftRuntimeInstaller(
        cacheDirPath.child('minecraft', 'manifest.json')
      ),
    };
  }

  /**
   * 指定されたランタイムを導入して実行パスを返す
   *
   * キャッシュに存在する場合はそれを使用
   *
   * @param useJavaw windowsのみ効果あり javaw.exeのパスを返す
   */
  async ready(
    runtime: Runtime,
    osPlatform: OsPlatform,
    useJavaw: boolean
  ): Promise<Result<Path>> {
    return this._ready(runtime, osPlatform, useJavaw);
  }

  private async _ready(
    runtime: Runtime,
    osPlatform: OsPlatform,
    useJavaw: boolean
  ): Promise<Result<Path>> {
    const metaPath = this.metaPath(runtime, osPlatform);

    // すでにインストール済み
    const current = await this.checkExists(metaPath, useJavaw);
    if (current.isOk) return current;

    // universalの場合はそれに対応するほかのランタイムをインストール
    if (runtime['type'] === 'universal')
      return this.readyUniversal(runtime, osPlatform, useJavaw);

    const installer = this.installerMap[runtime['type']];
    const installPeth = installer.getInstallPath(
      this.binDirPath,
      runtime,
      osPlatform
    );
    const meta = await installer.install(installPeth, runtime, osPlatform);
    if (meta.isErr) return meta;
    const metaVal = meta.value();

    return (await metaJson.stringify(metaVal).into(metaPath)).onOk(() =>
      ok(new Path(metaVal[useJavaw ? 'javaw' : 'java']['path']))
    );
  }

  /** universalだけ特殊 */
  private async readyUniversal(
    runtime: UniversalRuntime,
    osPlatform: OsPlatform,
    useJavaw: boolean
  ) {
    const refRuntime = await this.getUniversalConfig(
      osPlatform,
      runtime.majorVersion
    );

    const refInstallResult = await this._ready(
      refRuntime,
      osPlatform,
      useJavaw
    );

    if (refInstallResult.isErr) return refInstallResult;

    // 参照しているメタファイルの内容をコピー
    await this.metaPath(refRuntime, osPlatform).copyTo(
      this.metaPath(runtime, osPlatform)
    );

    return refInstallResult;
  }

  /**
   * 指定されたランタイムをキャッシュから削除
   */
  async remove(
    runtime: Runtime,
    osPlatform: OsPlatform
  ): Promise<Result<void>> {
    const metapath = this.metaPath(runtime, osPlatform);
    if (!metapath.exists()) return ok();
    const meta = await metapath.into(metaJson);
    if (meta.isErr) return meta;
    await new Path(meta.value().base.path).remove();
    await metapath.remove();
    return ok();
  }

  private async checkExists(metapath: Path, useJavaw: boolean) {
    const meta = await metapath.into(metaJson);
    if (meta.isOk) {
      const info = meta.value()?.[useJavaw ? 'javaw' : 'java'];
      if (info) {
        const { path, sha1 } = info;
        const binPath = new Path(path);
        const a = await binPath.into(SHA1);
        if (a.isOk && a.value() === sha1) {
          return ok(binPath);
        }
      }
    }
    return err.error('');
  }

  private metaPath(runtime: Runtime, osPlatform: OsPlatform) {
    const segments: string[] = [];
    switch (osPlatform) {
      case 'windows-x64':
        segments.push('windows', 'x64');
        break;
      case 'mac-os':
        segments.push('mac', 'x64');
        break;
      case 'mac-os-arm64':
        segments.push('mac', 'arm64');
        break;
      case 'debian':
      case 'redhat':
        segments.push('linux', 'x64');
        break;
    }
    switch (runtime.type) {
      case 'minecraft':
        segments.push('minecraft', `${runtime.version}.json`);
        break;
      case 'universal': {
        segments.push('universal', `${runtime.majorVersion}.json`);
        break;
      }
    }
    return this.metaDirPath.child(...segments);
  }
}

// src-electron\v2\source\runtime\test\assets\cache\meta
// こっちにランタイムの情報とパスを格納
//
// src-electron\v2\source\runtime\test\assets\cache\meta
// こっちにランタイム本体のパスを格納
//

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
  await workPath.mkdir();

  const runtimeContainer = new RuntimeContainer(workPath, async () => ({
    type: 'minecraft',
    version: 'jre-legacy',
  }));

  const runtimes: (Runtime & { explain: string })[] = [
    { explain: 'jre-legacy', type: 'minecraft', version: 'jre-legacy' },
    {
      explain: 'java-runtime-alpha',
      type: 'minecraft',
      version: 'java-runtime-alpha',
    },
    {
      explain: 'java-runtime-beta',
      type: 'minecraft',
      version: 'java-runtime-beta',
    },
    {
      explain: 'java-runtime-gamma',
      type: 'minecraft',
      version: 'java-runtime-gamma',
    },
    {
      explain: 'java-runtime-delta',
      type: 'minecraft',
      version: 'java-runtime-delta',
    },
    {
      explain: 'universal-8',
      type: 'universal',
      majorVersion: JavaMajorVersion.parse(21),
    },
  ];

  const osPlatforms: OsPlatform[] = [
    'windows-x64',
    'mac-os',
    'mac-os-arm64',
    'debian',
  ];

  // 公式がランタイムを提供していない組
  const missingCases: { os: OsPlatform; explain: string }[] = [
    { os: 'mac-os-arm64', explain: 'jre-legacy' },
    { os: 'mac-os-arm64', explain: 'java-runtime-alpha' },
    { os: 'mac-os-arm64', explain: 'java-runtime-beta' },
    { os: 'mac-os-arm64', explain: 'universal-8' },
  ];

  test.skip.each(
    osPlatforms.flatMap((os) => runtimes.map((runtime) => ({ runtime, os })))
  )(
    '$os $runtime.explain',
    async (testCase) => {
      // インストール
      const readyResult = await runtimeContainer.ready(
        testCase.runtime,
        testCase.os,
        true
      );

      // ランタイムが提供されている組み合わせかどうかをチェック
      const isValidPair =
        missingCases.find(
          (x) => x.os === testCase.os && x.explain === testCase.runtime.explain
        ) === undefined;

      expect(readyResult.isOk).toBe(isValidPair);

      // アンインストール
      const removeResult = await runtimeContainer.remove(
        testCase.runtime,
        testCase.os
      );
      expect(removeResult.isOk).toBe(true);
    },
    1000 * 1000
  );
}
