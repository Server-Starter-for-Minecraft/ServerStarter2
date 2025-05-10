import { GroupProgressor } from 'app/src-electron/common/progress';
import { OsPlatform } from 'app/src-electron/schema/os';
import {
  AllRuntimeManifests,
  JavaMajorVersion,
  Runtime,
  UniversalRuntime,
} from 'app/src-electron/schema/runtime';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { BytesData } from '../../util/binary/bytesData';
import { Path } from '../../util/binary/path';
import { isError, isValid } from '../../util/error/error';
import { Failable } from '../../util/error/failable';
import { RuntimeMeta } from './base';
import { JavaRuntimeInstaller } from './manifest';
import {
  MinecraftRuntimeInstaller,
  minecraftRuntimeManifestUrl,
} from './minecraft';

let metaJson: RuntimeMeta;

export class RuntimeContainer {
  private metaDirPath: Path;
  private binDirPath: Path;
  private installerMap: {
    [R in Exclude<
      Runtime,
      UniversalRuntime
    > as R['type']]: JavaRuntimeInstaller<AllRuntimeManifests[R['type']], R>;
  };

  /**
   * @param getUniversalConfig universalのjavaの実体を返す OuterResourcesから取得する構成
   */
  constructor(
    private cacheDirPath: Path,
    private getUniversalConfig: (
      osPlatform: OsPlatform,
      majorVersion: JavaMajorVersion
    ) => Promise<Failable<Exclude<Runtime, UniversalRuntime>>>
  ) {
    this.metaDirPath = cacheDirPath.child('meta');
    this.binDirPath = cacheDirPath.child('bin');
    this.installerMap = {
      minecraft: MinecraftRuntimeInstaller.setRuntimeManifest(
        cacheDirPath.child('minecraft', 'manifest.json'),
        minecraftRuntimeManifestUrl
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
    useJavaw: boolean,
    progress?: GroupProgressor
  ): Promise<Failable<Path>> {
    progress?.title({ key: 'server.readyJava.title' });
    return this._ready(runtime, osPlatform, useJavaw, progress);
  }

  private async _ready(
    runtime: Runtime,
    osPlatform: OsPlatform,
    useJavaw: boolean,
    progress?: GroupProgressor
  ): Promise<Failable<Path>> {
    const metaPath = this.metaPath(runtime, osPlatform);

    // すでにインストール済み
    const current = await this.checkExists(metaPath, useJavaw);
    if (isValid(current)) return current;

    // universalの場合はそれに対応するほかのランタイムをインストール
    if (runtime['type'] === 'universal')
      return this.readyUniversal(runtime, osPlatform, useJavaw);

    const installer = this.installerMap[runtime['type']];
    const meta = await installer.install(
      this.binDirPath,
      runtime,
      osPlatform,
      progress
    );
    if (isError(meta)) return meta;

    const writeRes = await metaPath.writeJson(meta);
    if (isError(writeRes)) return writeRes;

    return new Path(meta[useJavaw ? 'javaw' : 'java']['path']);
  }

  /** universalだけ特殊 */
  private async readyUniversal(
    runtime: UniversalRuntime,
    osPlatform: OsPlatform,
    useJavaw: boolean
  ) {
    const refRuntimeOrError = await this.getUniversalConfig(
      osPlatform,
      runtime.majorVersion
    );
    if (isError(refRuntimeOrError)) return refRuntimeOrError;
    const refRuntime = refRuntimeOrError;

    const refInstallResult = await this._ready(
      refRuntime,
      osPlatform,
      useJavaw
    );
    if (isError(refInstallResult)) return refInstallResult;

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
  ): Promise<Failable<void>> {
    const metapath = this.metaPath(runtime, osPlatform);
    if (!metapath.exists()) return;

    const _metaJson = await metapath.readJson(RuntimeMeta);
    if (isError(_metaJson)) return _metaJson;
    else metaJson = _metaJson;

    await new Path(metaJson.base.path).remove();
    await metapath.remove();
  }

  private async checkExists(
    metapath: Path,
    useJavaw: boolean
  ): Promise<Failable<Path>> {
    if (!metapath.exists()) {
      return errorMessage.data.path.notFound({
        type: 'file',
        path: metapath.path,
      });
    }

    const _metaJson = await metapath.readJson(RuntimeMeta);
    if (isError(_metaJson)) return _metaJson;
    else metaJson = _metaJson;

    const info = metaJson[useJavaw ? 'javaw' : 'java'];
    const { path, sha1 } = info;
    const binPath = new Path(path);
    const binData = await BytesData.fromPath(binPath);
    if (isError(binData)) return binData;
    const binHash = await binData.hash('sha1');
    if (isError(binHash)) return binHash;

    if (binHash !== sha1) {
      return errorMessage.data.hashNotMatch({
        hashtype: 'sha1',
        type: 'url',
        path,
      });
    }

    return binPath;
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

    if (runtime['type'] === 'universal') {
      segments.push('universal', `${runtime.majorVersion}.json`);
    } else {
      const installer = this.installerMap[runtime.type];
      segments.push(
        runtime.type,
        `${installer.getRuntimeVersion(runtime)}.json`
      );
    }

    return this.metaDirPath.child(...segments);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('runtime installer', async () => {
    const path = await import('path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child(
      'work',
      path.basename(__filename, '.ts')
    );
    await workPath.emptyDir();

    // 実際にはUrlにアクセスせず、url文字列を結果として返す
    // cf) Mockを使わない場合，テストがエラーになることがあるが，これはVitest上でTimeoutがうまく設定できていないことが原因
    // Electron(Chromium)上で動かす場合はTimeoutが２分程度に緩和されるため，テストではMockで代用
    // @see https://scrapbox.io/nwtgck/Google_Chrome%E3%81%AEfetch()%E3%81%AE%E3%82%BF%E3%82%A4%E3%83%A0%E3%82%A2%E3%82%A6%E3%83%88%E3%81%AE%E6%99%82%E9%96%93
    const urlCreateReadStreamSpy = vi.spyOn(BytesData, 'fromPathOrUrl');
    urlCreateReadStreamSpy.mockImplementation(async (path, url) => {
      // すでにダウンロード済みのデータがある場合は通常通り利用する
      const data = await BytesData.fromPath(path);
      if (isValid(data)) return data;

      // 全OSの全Runtime情報が記載されたのManifestのみ実データを使う
      let resData: Failable<BytesData>;
      if (url.startsWith('https://launchermeta')) {
        resData = await BytesData.fromURL(url);
      } else {
        resData = await BytesData.fromText(url);
      }
      if (isError(resData)) return resData;

      // 本来と同じように取得した（ことになっているデータ）はファイルに書き込む
      await path.parent().mkdir(true);
      await resData.write(path.path);
      return resData;
    });

    const _getUniversalConfig = async () => {
      return {
        type: 'minecraft',
        version: 'jre-legacy',
      } as const;
    };
    const runtimeContainer = new RuntimeContainer(
      workPath,
      _getUniversalConfig
    );

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

    // テスト実行に時間がかかることに加え，APIサーバーからのキックが頻発するため，テストはSkip
    test.each(
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
            (x) =>
              x.os === testCase.os && x.explain === testCase.runtime.explain
          ) === undefined;
        expect(isValid(readyResult)).toBe(isValidPair);

        // アンインストール
        const removeResult = await runtimeContainer.remove(
          testCase.runtime,
          testCase.os
        );
        expect(isValid(removeResult)).toBe(true);
      },
      1000 * 1000
    );
  });
}
