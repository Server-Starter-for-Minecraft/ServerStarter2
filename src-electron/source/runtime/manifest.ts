/**
 * Runtimeを生成するためのファクトリー
 *
 * Runtimeに関する情報（＝Manifest）とその処理を各Runtimeごとに実装することを想定
 */
import { z } from 'zod';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { Failable } from 'app/src-electron/schema/error';
import {
  ManifestContent,
  ManifestDirectory,
  ManifestFile,
  ManifestLink,
} from 'app/src-electron/schema/manifest';
import { OsPlatform } from 'app/src-electron/schema/os';
import { Runtime, RuntimeManifest } from 'app/src-electron/schema/runtime';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { CacheableAccessor } from 'app/src-electron/util/cache';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { groupBy } from 'app/src-electron/util/object/groupBy';
import { runtimeLoggers, RuntimeMeta } from './base';

type JavaExecName = {
  java: string;
  javaw: string;
};

export abstract class JavaRuntimeInstaller<
  RM extends RuntimeManifest,
  R extends Runtime
> {
  /** RuntimeのManifestファイルを操作 */
  private accessor: CacheableAccessor<RM>;
  /** 設定するRuntimeの名前 */
  static readonly manifestName: Runtime['type'];

  protected constructor(accessor: CacheableAccessor<RM>) {
    this.accessor = accessor;
  }

  /**
   * Manifestのハンドラーを生成
   *
   * 以下のプログラムを継承先で実装すること
   * ```ts
   * static setRuntimeManifest(
   *   validator: z.ZodDefault<z.ZodSchema<AllManifest, z.ZodTypeDef, any>>,
   *   manifestPath: Path,
   *   manifestUrl: string
   * ) {
   *   return new RuntimeManifest(
   *     this.getCacheableAccessor(validator, manifestPath, manifestUrl)
   *   );
   * }
   * ```
   *
   * このメソッドを呼び出すことで、RuntimeManifestのインスタンスを生成する
   */
  static setRuntimeManifest(manifestPath: Path, manifestUrl: string) {
    throw new Error('setRuntimeManifest() not implemented');
  }

  protected static getCacheableAccessor<RM extends RuntimeManifest>(
    validator: z.ZodSchema<RM, z.ZodTypeDef, any>,
    manifestPath: Path,
    manifestUrl: string
  ) {
    const getter = async (): Promise<Failable<RM>> => {
      const urlRes = await BytesData.fromUrlOrPath(manifestPath, manifestUrl);
      if (isError(urlRes)) return urlRes;
      return urlRes.json(validator);
    };

    const setter = async (value: RM): Promise<Failable<void>> => {
      return manifestPath.writeJson(value);
    };

    return new CacheableAccessor(getter, setter);
  }

  /**
   * Runtimeのバージョン（`java-runtime-alpha`など）を指定する
   */
  abstract getRuntimeVersion(runtime: R): string;

  /**
   * Runtime特有のManifestから標準的な表現である`ManifestContent`に整形する
   */
  protected abstract getManifestContent(
    manifest: RuntimeManifest,
    runtime: R,
    osPlatForm: OsPlatform
  ): Promise<Failable<ManifestContent>>;

  /**
   * Java実行ファイル名をOS別に指定する
   */
  protected abstract getRuntimeFileNames(osPlatForm: OsPlatform): JavaExecName;

  /**
   * 各Runtimeに対応したManifestから生成した必要なファイル一覧を`manifest`引数に渡すことで，
   * 必要なファイルの展開が実行される
   */
  protected async extractFilesFromManifest(
    installPath: Path,
    manifest: ManifestContent,
    progress?: GroupProgressor
  ): Promise<Failable<void>> {
    return _extractFilesFromManifest(installPath, manifest, progress);
  }

  /**
   * JavaRuntimeをダウンロードしておく場所
   */
  protected getInstallPath(
    installBasePath: Path,
    runtime: R,
    osPlatform: OsPlatform
  ): Path {
    return installBasePath.child(
      runtime.type,
      this.getRuntimeVersion(runtime),
      osPlatform
    );
  }

  /**
   * Manifestによって展開されたファイル群の中からJava実行ファイルのパスを取得する
   *
   * 第１戻値に`java`, 第２戻値に`javaw`が入る
   */
  protected manifest2JavaPath(
    manifestContent: ManifestContent,
    javaExecName: JavaExecName
  ): Failable<[[string, ManifestFile], [string, ManifestFile]]> {
    const java = Object.entries(manifestContent.files).find(
      ([k, value]) => k.endsWith(javaExecName.java) && value.type === 'file'
    ) as [string, ManifestFile];
    if (java === undefined)
      return errorMessage.data.path.notFound({
        type: 'file',
        path: 'MISSING JAVA RUNTIME FILE PATH',
      });

    const javaw = Object.entries(manifestContent.files).find(
      ([k, value]) => k.endsWith(javaExecName.javaw) && value.type === 'file'
    ) as [string, ManifestFile];
    if (javaw === undefined)
      return errorMessage.data.path.notFound({
        type: 'file',
        path: 'MISSING JAVAW RUNTIME FILE PATH',
      });

    return [java, javaw];
  }

  /**
   * `installBasePath`に指定した場所を基準にRuntimeをインストールする
   */
  async install(
    installBasePath: Path,
    runtime: R,
    osPlatform: OsPlatform,
    progress?: GroupProgressor
  ): Promise<Failable<RuntimeMeta>> {
    const logger = runtimeLoggers().install({
      installBasePath: installBasePath.path,
      runtime,
      osPlatform,
    });

    // RuntimeのManifestを取得
    const allManifest = await this.accessor.get();
    if (isError(allManifest)) return allManifest;
    logger.info('Get `all-manifest` successfully');

    // 取得したManifestから対象のOSのManifestを取得
    const osManifest = await this.getManifestContent(
      allManifest,
      runtime,
      osPlatform
    );
    if (isError(osManifest)) return osManifest;
    logger.info('Get a manifest for target OS successfully');

    // 取得したManifestから必要なファイル類を生成する
    const installPath = this.getInstallPath(
      installBasePath,
      runtime,
      osPlatform
    );
    const extractRes = await this.extractFilesFromManifest(
      installPath,
      osManifest,
      progress
    );
    if (isError(extractRes)) {
      logger.error('Extract files from manifest failed', extractRes);
      return errorMessage.core.runtime.installFailed({
        runtimeType: runtime.type,
        targetOs: osPlatform,
        version: this.getRuntimeVersion(runtime),
      });
    }
    logger.info('Extract files from manifest successfully');

    // 生成したファイル群の中から実行パスを特定する
    const runtimeFileNames = this.getRuntimeFileNames(osPlatform);
    const javaPaths = this.manifest2JavaPath(osManifest, runtimeFileNames);
    if (isError(javaPaths)) return javaPaths;
    logger.info('Get java path successfully And completed installation');

    return {
      base: { path: installPath.path },
      java: {
        path: installPath.child(javaPaths[0][0]).path,
        sha1: javaPaths[0][1].downloads.raw.sha1,
      },
      javaw: {
        path: installPath.child(javaPaths[1][0]).path,
        sha1: javaPaths[1][1].downloads.raw.sha1,
      },
    };
  }
}

// テスト用に実装を分離
async function _extractFilesFromManifest(
  installPath: Path,
  manifest: ManifestContent,
  progress?: GroupProgressor
): Promise<Failable<void>> {
  await installPath.emptyDir();

  const entries = Object.entries(manifest.files);
  const { directory, link, file } = groupBy(
    entries.map(([k, v]) => ({
      path: installPath.child(k),
      entry: v,
    })),
    (x) => x.entry.type
  ) as {
    directory: { path: Path; entry: ManifestDirectory }[] | undefined;
    link: { path: Path; entry: ManifestLink }[] | undefined;
    file: { path: Path; entry: ManifestFile }[] | undefined;
  };

  // progress 対応
  let processed = 0;
  const numeric = progress?.numeric('file', entries.length);
  const subtitle = progress?.subtitle({
    key: 'server.readyJava.file',
    args: {
      path: '',
    },
  });

  if (directory) {
    await Promise.all(
      directory.map(async ({ path }) => {
        subtitle?.setSubtitle({
          key: 'server.readyJava.file',
          args: { path: path.path },
        });
        await path.mkdir();
        numeric?.setValue(processed++);
      })
    );
  }

  if (file) {
    const res = await Promise.all(
      file.map(async ({ path, entry }) => {
        subtitle?.setSubtitle({
          key: 'server.readyJava.file',
          args: { path: path.path },
        });
        const result = await BytesData.fromPathOrUrl(
          path,
          entry.downloads.raw.url,
          { value: entry.downloads.raw.sha1, type: 'sha1' },
          false,
          undefined,
          entry.executable
        );
        numeric?.setValue(processed++);
        return result;
      })
    );
    const err = res.find(isError);
    if (err) return err;
  }

  if (link) {
    const results = await Promise.all(
      link.map(async ({ path, entry }) => {
        subtitle?.setSubtitle({
          key: 'server.readyJava.file',
          args: { path: path.path },
        });
        await path.mklink(path.child(entry.target));
        numeric?.setValue(processed++);
      })
    );
    const err = results.find(isError);
    if (err) return err;
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect, vi } = import.meta.vitest;

  describe('runtime manifest base', async () => {
    const { Path } = await import('src-electron/util/binary/path');

    // 一時使用フォルダを初期化
    const workPath = new Path(__dirname).child('work', 'manifest');
    await workPath.emptyDir();

    // 実際にはUrlにアクセスせず、url文字列を結果として返す
    const urlCreateReadStreamSpy = vi.spyOn(BytesData, 'fromURL');
    urlCreateReadStreamSpy.mockImplementation(function (url: string) {
      return BytesData.fromText(url);
    });

    const file = (url: string) => ({
      type: 'file' as const,
      executable: false,
      downloads: {
        raw: { url, sha1: '', size: 111 },
      },
    });
    const directory = { type: 'directory' as const };

    const testCases: TestCase[] = [
      {
        explain: 'file',
        manifest: { 'foo.txt': file('https://a.com/') },
        files: [{ path: 'foo.txt', value: 'https://a.com/' }],
      },
      {
        explain: 'subfile',
        manifest: {
          foo: directory,
          'foo/bar.txt': file('https://foo/bar.com/'),
          'bar.txt': file('https://bar.com/'),
          buz: directory,
        },
        files: [
          { path: 'foo/bar.txt', value: 'https://foo/bar.com/' },
          { path: 'bar.txt', value: 'https://bar.com/' },
        ],
        dirs: [{ path: 'foo' }, { path: 'buz' }],
      },
      {
        explain: 'link',
        manifest: {
          'a.txt': file('https://a.com/'),
          'foo.lnk': { type: 'link', target: '../a.txt' },
        },
        links: [{ path: 'foo.lnk', target: 'hello' }],
      },
    ];

    test.each(
      testCases.map((testCase, index) => ({
        explain: testCase.explain,
        testCase,
        index,
      }))
    )('$explain', async ({ testCase, index }) => {
      const dirPath = workPath.child(`${index}`);
      await dirPath.remove();
      const res = await _extractFilesFromManifest(dirPath, {
        files: testCase.manifest,
      });
      expect(isError(res)).toBe(false);

      for (const file of testCase.files ?? []) {
        expect(await dirPath.child(file.path).readText()).toBe(file.value);
      }
      for (const link of testCase.links ?? []) {
        const stat = await dirPath.child(link.path).stat();
        if (isError(stat)) continue;
        expect(stat.nlink).greaterThan(1); // symlinkではなく、ハードリンクなのでリンクの数が1以上かどうかで判断
      }
      for (const dir of testCase.dirs ?? []) {
        expect(await dirPath.child(dir.path).isDirectory()).toBe(true);
      }
    });

    type TestCase = {
      explain: string;
      manifest: ManifestContent['files'];
      files?: { path: string; value: string }[];
      links?: { path: string; target: string }[];
      dirs?: { path: string }[];
    };
  });
}
