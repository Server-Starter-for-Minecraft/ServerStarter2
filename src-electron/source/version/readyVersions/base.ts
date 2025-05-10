import { Failable } from 'app/src-electron/schema/error';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { Runtime } from '../../../schema/runtime';
import { UnknownVersion, Version } from '../../../schema/version';
import { Path } from '../../../util/binary/path';
import { getLog4jArg, saveLog4JPatch } from './utils/log4j';
import {
  generateVersionJsonHandler,
  replaceEmbedArgs,
  VersionJson,
} from './utils/versionJson';

/**
 * サーバーJarファイルのパスを返す
 */
export function getJarPath(cwdPath: Path) {
  return cwdPath.child('version.jar');
}

export type ExecRuntime = (options: {
  runtime: Runtime;
  args: string[];
  currentDir: Path;
  onOut: (line: string) => void;
}) => Promise<Failable<void>>;

/**
 * 各サーバーバージョンに関連するファイルの操作をするための抽象クラス
 */
abstract class BaseVersionProcess<V extends Exclude<Version, UnknownVersion>> {
  /**
   * 対象とするバージョンの情報
   */
  protected _version: V;
  /**
   * キャッシュデータ一式を格納するフォルダ
   */
  protected _cacheFolder: Path;
  /**
   * 「サーバーJar」や「log4Jのパッチファイル」といった主要なキャッシュファイル以外で対象とすべきキャッシュファイル群
   *
   * 各サーバーでこのほかに必要なファイルがある場合はコンストラクタの引数で指定する
   */
  protected _cachedSecondaryFiles: string[];

  constructor(version: V, cacheFolder: Path, cachedSecondaryFiles?: string[]) {
    this._version = version;
    this._cacheFolder = cacheFolder;
    this._cachedSecondaryFiles = [
      'libraries',
      'eula.txt',
      ...(cachedSecondaryFiles ?? []),
    ];
  }

  /**
   * 各サーバーを一意に特定するためのID
   *
   * バニラはVersionIDそのままでOKだが，Forge等ではVersionIDのほかにビルド番号を考慮する必要がある
   */
  abstract get serverID(): string;

  /**
   * 各サーバー別のキャッシュファイルの保存先
   */
  get cachePath() {
    return this._cacheFolder.child(`${this._version.type}/${this.serverID}`);
  }
}

/**
 * `server.jar`やその関連するサーバーファイルを設置する
 *
 * このクラスは各サーバーごとに１つのみ生成する
 */
export abstract class ReadyVersion<
  V extends Exclude<Version, UnknownVersion>
> extends BaseVersionProcess<V> {
  /**
   * VersionJsonを扱うJsonHandlerを格納する
   */
  protected handler: JsonSourceHandler<VersionJson> | undefined;

  /**
   * バージョン関連のファイル操作を完全に完了する
   */
  async completeReady4VersionFiles(targetPath: Path, execRuntime: ExecRuntime) {
    // STEP1: `version.json`の生成
    if (!this.handler) {
      // handlerを生成
      this.handler = generateVersionJsonHandler(
        this._cacheFolder,
        this._version.type,
        this.serverID
      );

      if (isError(await this.handler.read())) {
        // `version.json`のオブジェクトを生成
        const verJson = await this.generateVersionJson();
        if (isError(verJson)) return verJson;

        const res = await this.handler.write(verJson);
        if (isError(res)) return res;
      }
    }

    // STEP2: キャッシュデータを整備
    const copyFiles = await this.readyCache(this.handler, execRuntime);
    if (isError(copyFiles)) return copyFiles;

    // STEP3: ファイルをキャッシュから移動
    await this.setFiles(copyFiles, targetPath);

    // STEP4: 戻り値を生成
    return this.generateReadyVersionReturns(this.handler, targetPath);
  }

  /**
   * キャッシュを準備する
   *
   * サーバー実行に必要なパスの一覧を返す
   */
  protected async readyCache(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime
  ): Promise<Failable<Path[]>> {
    // Jarの生成
    const cachedJarPath = getJarPath(this.cachePath);
    if (!cachedJarPath.exists()) {
      // Jarのダウンロードとファイルへの書き出し
      const generateJarRes = await this.generateCachedJar(
        verJsonHandler,
        execRuntime
      );
      if (isError(generateJarRes)) return generateJarRes;
    }
    const paths = [cachedJarPath];

    // Log4J対応
    const log4JPatchPath = await saveLog4JPatch(
      this._version.id,
      this.cachePath
    )();
    if (isError(log4JPatchPath)) return log4JPatchPath;
    if (log4JPatchPath !== null) paths.push(log4JPatchPath);

    // その他のキャッシュファイル
    paths.push(
      ...this._cachedSecondaryFiles.map((fileName) =>
        this.cachePath.child(fileName)
      )
    );

    return paths;
  }

  /**
   * キャッシュをコピーする
   */
  protected async setFiles(paths: Path[], targetPath: Path): Promise<void> {
    await Promise.all(
      paths.map((p) => p.copyTo(targetPath.child(p.basename())))
    );
  }

  /**
   * 各バージョンに関するダウンロードURLや起動時引数等の情報を持つ`version.json`を生成する
   */
  protected abstract generateVersionJson(): Promise<Failable<VersionJson>>;

  /**
   * キャッシュされたJarを生成する
   */
  protected abstract generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime
  ): Promise<Failable<void>>;

  /**
   * 当該サーバーにおけるRuntimeオブジェクトを生成する
   */
  protected async getRuntime<R extends Runtime>(
    runtimeType: R['type'],
    verJsonHandler: JsonSourceHandler<VersionJson>
  ): Promise<Failable<R>> {
    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    switch (runtimeType) {
      case 'minecraft':
        return {
          type: runtimeType,
          version: verJson.javaVersion?.component ?? 'jre-legacy',
        } as R;
      case 'universal':
        return {
          type: 'universal',
          majorVersion: verJson.javaVersion?.majorVersion ?? 8,
        } as R;
    }
  }

  /**
   * `readyVerison()`で要求される戻り値を生成する
   */
  protected async generateReadyVersionReturns(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    targetPath: Path
  ): Promise<
    Failable<{
      runtime: Runtime;
      getCommand: (option: { jvmArgs: string[] }) => string[];
    }>
  > {
    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    const runtime = await this.getRuntime('minecraft', verJsonHandler);
    if (isError(runtime)) return runtime;

    return {
      runtime: runtime,
      getCommand: (option: { jvmArgs: string[] }) => {
        const log4jArg = getLog4jArg(this._version.id);
        return replaceEmbedArgs(verJson.arguments, {
          JAR_PATH: [getJarPath(targetPath).path],
          JVM_ARGUMENT: option.jvmArgs,
          LOG4J_ARG: log4jArg ? [log4jArg] : [],
        });
      },
    };
  }
}

/**
 * `server.jar`やその関連するサーバーファイルを削除する
 */
export abstract class RemoveVersion<
  V extends Exclude<Version, UnknownVersion>
> extends BaseVersionProcess<V> {
  /**
   * サーバーファイル群をキャッシュに撤退させる
   */
  async completeRemoveVersion(targetPath: Path) {
    // server.jarを登録
    const paths = [getJarPath(targetPath)];

    // Log4J対応
    const log4JPatchPath = await saveLog4JPatch(this._version.id, targetPath)();
    if (isValid(log4JPatchPath) && log4JPatchPath !== null) {
      paths.push(log4JPatchPath);
    }

    // その他のキャッシュファイル
    paths.push(
      ...this._cachedSecondaryFiles.map((fileName) =>
        targetPath.child(fileName)
      )
    );

    // ファイル群を削除してキャッシュに撤退
    await this.removeFiles(paths);
  }

  /**
   * サーバーファイル群をキャッシュに撤退させる
   */
  protected async removeFiles(paths: Path[]): Promise<void> {
    // キャッシュに撤退
    await Promise.all(
      paths.map((p) => p.copyTo(this.cachePath.child(p.basename())))
    );
    // 元ファイルを削除
    await Promise.all(paths.map((p) => p.remove()));
  }
}
