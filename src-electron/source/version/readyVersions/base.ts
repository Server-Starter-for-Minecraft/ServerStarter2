import { GroupProgressor } from 'app/src-electron/common/progress';
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
  runtime?: Runtime;
  args: string[];
  currentDir: Path;
  onOut: (line: string) => void;
}) => Promise<Failable<void>>;

export type ReadyReturnInfo = {
  runtime: Runtime;
  getCommand: (option: { jvmArgs: string[] }) => string[];
};

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
  protected _cachedSecondaryFiles: (string | RegExp)[];

  constructor(
    version: V,
    cacheFolder: Path,
    cachedSecondaryFiles?: (string | RegExp)[]
  ) {
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
  async completeReady4VersionFiles(
    targetPath: Path,
    execRuntime: ExecRuntime,
    progress?: GroupProgressor
  ): Promise<Failable<ReadyReturnInfo>> {
    progress?.title({
      key: 'server.readyVersion.title',
      args: { version: this._version },
    });

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
        const verJson = await this.generateVersionJson(progress);
        if (isError(verJson)) return verJson;

        const res = await this.handler.write(verJson);
        if (isError(res)) return res;
      }
    }

    // STEP2: キャッシュデータを整備
    const copyFiles = await this.readyCache(
      this.handler,
      execRuntime,
      progress
    );
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
    execRuntime: ExecRuntime,
    progress?: GroupProgressor
  ): Promise<Failable<Path[]>> {
    // Jarの生成
    const cachedJarPath = getJarPath(this.cachePath);
    if (!cachedJarPath.exists()) {
      // Jarのダウンロードとファイルへの書き出し
      const generateJarRes = await this.generateCachedJar(
        verJsonHandler,
        execRuntime,
        progress
      );
      if (isError(generateJarRes)) return generateJarRes;
    }
    const paths = [cachedJarPath];

    // Log4J対応
    const log4JPatchPath = await saveLog4JPatch(
      this._version.id,
      this.cachePath,
      progress
    )();
    if (isError(log4JPatchPath)) return log4JPatchPath;
    if (log4JPatchPath !== null) paths.push(log4JPatchPath);

    // その他のキャッシュファイル
    const cachedMatchFiles = await getMatchFiles(
      this.cachePath,
      this._cachedSecondaryFiles
    );
    if (isError(cachedMatchFiles)) return cachedMatchFiles;
    paths.push(...cachedMatchFiles);

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
  protected abstract generateVersionJson(
    progress?: GroupProgressor
  ): Promise<Failable<VersionJson>>;

  /**
   * キャッシュされたJarを生成する
   */
  protected abstract generateCachedJar(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    execRuntime: ExecRuntime,
    progress?: GroupProgressor
  ): Promise<Failable<void>>;

  /**
   * 当該サーバーにおけるRuntimeオブジェクトを生成する
   */
  protected async getRuntime(
    verJsonHandler: JsonSourceHandler<VersionJson>
  ): Promise<Failable<Runtime>> {
    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    if (verJson.javaVersion?.component) {
      return {
        type: 'minecraft',
        version: verJson.javaVersion?.component,
      } as Runtime;
    } else if (verJson.javaVersion?.majorVersion) {
      return {
        type: 'universal',
        majorVersion: verJson.javaVersion.majorVersion,
      } as Runtime;
    }

    // fall back
    return {
      type: 'minecraft',
      version: 'jre-legacy',
    };
  }

  /**
   * `readyVerison()`で要求される戻り値を生成する
   */
  protected async generateReadyVersionReturns(
    verJsonHandler: JsonSourceHandler<VersionJson>,
    targetPath: Path
  ): Promise<Failable<ReadyReturnInfo>> {
    const verJson = await verJsonHandler.read();
    if (isError(verJson)) return verJson;

    const runtime = await this.getRuntime(verJsonHandler);
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

    // Log4J対応（対象ファイル名取得のみのため，`saveLog4JPatch()`にprogressは設定しない）
    const log4JPatchPath = await saveLog4JPatch(this._version.id, targetPath)();
    if (isValid(log4JPatchPath) && log4JPatchPath !== null) {
      paths.push(log4JPatchPath);
    }

    // その他のキャッシュファイル
    const cachedMatchFiles = await getMatchFiles(
      targetPath,
      this._cachedSecondaryFiles
    );
    if (isError(cachedMatchFiles)) return cachedMatchFiles;
    paths.push(...cachedMatchFiles);

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

/**
 * 指定したカレントディレクトリに入っているファイルのうち，`patterns`にマッチするものを取得する
 */
async function getMatchFiles(
  cwd: Path,
  patterns: (string | RegExp)[]
): Promise<Failable<Path[]>> {
  const files = await cwd.iter();
  if (isError(files)) return files;

  return patterns
    .map((pattern) => {
      if (typeof pattern === 'string') {
        return cwd.child(pattern);
      } else {
        return files.filter((p) => pattern.test(p.basename()));
      }
    })
    .flat();
}
