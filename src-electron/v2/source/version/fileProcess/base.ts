import { versionsCachePath } from 'app/src-electron/v2/core/const';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { Runtime } from '../../../schema/runtime';
import { UnknownVersion, Version } from '../../../schema/version';
import { ok, Result } from '../../../util/base';
import { Path } from '../../../util/binary/path';
import { getLog4jArg, saveLog4JPatch } from './log4j';
import {
  generateVersionJsonHandler,
  getVersionJsonPath,
  replaceEmbedArgs,
  VersionJson,
} from './versionJson';

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
  onOut: (line: Result<string, string>) => void;
}) => Promise<Result<void>>;

/**
 * 各サーバーバージョンに関連するファイルの操作をするための抽象クラス
 */
abstract class BaseVersionProcess<V extends Exclude<Version, UnknownVersion>> {
  /**
   * 対象とするバージョンの情報
   */
  protected _version: V;
  /**
   * 「サーバーJar」や「log4Jのパッチファイル」といった主要なキャッシュファイル以外で対象とすべきキャッシュファイル群
   *
   * 各サーバーでこのほかに必要なファイルがある場合はコンストラクタの引数で指定する
   */
  protected _cachedSecondaryFiles: string[];

  constructor(version: V, cachedSecondaryFiles?: string[]) {
    this._version = version;
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
    return versionsCachePath.child(`${this._version.type}/${this.serverID}`);
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
        this._version.type,
        this.serverID
      );

      if ((await this.handler.read()).isErr) {
        // `version.json`のオブジェクトを生成
        const verJson = await this.generateVersionJson();
        if (verJson.isErr) return verJson;

        const res = await this.handler.write(verJson.value());
        if (res.isErr) return res;
      }
    }

    // STEP2: キャッシュデータを整備
    const copyFiles = await this.readyCache(this.handler, execRuntime);
    if (copyFiles.isErr) return copyFiles;

    // STEP3: ファイルをキャッシュから移動
    await this.setFiles(copyFiles.value(), targetPath);

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
  ): Promise<Result<Path[]>> {
    // Jarの生成
    const cachedJarPath = getJarPath(this.cachePath);
    if (!cachedJarPath.exists()) {
      // Jarのダウンロードとファイルへの書き出し
      const generateJarRes = await this.generateCachedJar(
        verJsonHandler,
        execRuntime
      );
      if (generateJarRes.isErr) return generateJarRes;
    }
    const paths = [cachedJarPath];

    // Log4J対応
    const log4JPatchPath = await saveLog4JPatch(
      this._version.id,
      this.cachePath
    )();
    if (log4JPatchPath.isErr) return log4JPatchPath;
    const log4JPatchPathVal = log4JPatchPath.value();
    if (log4JPatchPathVal !== null) paths.push(log4JPatchPathVal);

    // その他のキャッシュファイル
    paths.push(
      ...this._cachedSecondaryFiles.map((fileName) =>
        this.cachePath.child(fileName)
      )
    );

    return ok(paths);
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
  protected abstract generateVersionJson(): Promise<Result<VersionJson>>;

  /**
   * キャッシュされたJarを生成する
   */
  protected abstract generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime
  ): Promise<Result<void>>;

  /**
   * 当該サーバーにおけるRuntimeオブジェクトを生成する
   */
  protected abstract getRuntime(
    verJsonHandler: JsonSourceHandler<VersionJson>
  ): Promise<Result<Runtime>>;

  /**
   * `readyVerison()`で要求される戻り値を生成する
   */
  protected async generateReadyVersionReturns(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    targetPath: Path
  ): Promise<
    Result<{
      runtime: Runtime;
      getCommand: (option: { jvmArgs: string[] }) => string[];
    }>
  > {
    const verJson = await verJsonHandler.read();
    if (verJson.isErr) return verJson;

    const runtime = await this.getRuntime(verJsonHandler);

    if (runtime.isErr) return runtime;

    return ok({
      runtime: runtime.value(),
      getCommand: (option: { jvmArgs: string[] }) => {
        return replaceEmbedArgs(verJson.value().arguments, {
          JAR_PATH: [getVersionJsonPath(targetPath).toStr()],
          JVM_ARGUMENT: option.jvmArgs,
          LOG4J_ARG: [getLog4jArg(this._version.id) ?? ''],
        });
      },
    });
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
    log4JPatchPath.onOk((p) => {
      if (p !== null) paths.push(p);
      return ok();
    });

    // その他のキャッシュファイル
    paths.push(
      ...this._cachedSecondaryFiles.map((fileName) =>
        targetPath.child(fileName)
      )
    );

    // ファイル群を削除してキャッシュに撤退
    await this.removeFiles(paths);

    return ok();
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
