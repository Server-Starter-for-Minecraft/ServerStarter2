import { AllVersion, Version, VersionType } from 'src-electron/schema/version';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { BytesData } from '../../util/bytesData';
import { Failable } from '../../util/error/failable';
import { Path } from '../../util/path';
import { versionsCachePath } from '../const';
import { rootLoggerHierarchy } from '../logger';
import { GroupProgressor } from '../progress/progress';
import { versionConfig } from '../stores/config';
import { eulaUnnecessaryVersionIds } from './const';
import { JavaComponent } from './vanilla';

export const versionLoggers = rootLoggerHierarchy.server.version;

export type VersionComponent = {
  programArguments: string[];
  component: JavaComponent;
};

export type VersionLoader<V extends Version> = {
  readyVersion(
    version: V,
    cwdPath: Path,
    progress?: GroupProgressor
  ): Promise<Failable<VersionComponent>>;

  /**
   * @param useCache ローカルのキャッシュを使用するかどうか
   *
   * - true      ローカルにキャッシュがあれば使用(最新版でない可能性あり) 速い
   * - false     必ずリモートから最新版を取得(必ず最新版) 遅い
   * - undefined 起動中にリモートから取得済みだったらローカルを使用(おそらく最新版) 初回だけ遅い
   */
  getAllVersions(
    useCache: boolean | undefined
  ): Promise<Failable<AllVersion<V['type']>>>;

  /** サーバーの起動にminecraft Eulaへの同意が必要かどうか */
  needEulaAgreement(version: V): boolean;
};

export function needEulaAgreementVanilla(version: Version) {
  // 1.17.10-pre1以前はfalse
  return !eulaUnnecessaryVersionIds.includes(version.id);
}

export const genGetAllVersions = <V extends Version>(
  type: V['type'],
  getAllVersionsFromRemote: () => Promise<Failable<AllVersion<V['type']>>>
) =>
  async function result(
    useCache: boolean | undefined
  ): Promise<Failable<AllVersion<V['type']>>> {
    // ローカルのデータが最新版ならローカルのデータを使う
    if (useCache === undefined) useCache = true;

    const logger = versionLoggers.getAllVersions({ type, useCache });
    logger.start();

    const jsonpath = versionsCachePath.child(`${type}/${type}-all.json`);
    const configkey = `versions_sha1.${type}`;

    if (useCache) {
      // ローカルから読み込み
      const versions = await getAllLocalVersions<V>(jsonpath, configkey);
      if (versions !== undefined) {
        logger.success('load from local');
        return versions;
      }
    }

    const versions = await getAllVersionsFromRemote();
    if (isError(versions)) {
      logger.fail(versions);
      return versions;
    }

    const data = await BytesData.fromText(JSON.stringify(versions));
    if (isError(data)) {
      logger.fail(data);
      return data;
    }

    // 結果をローカルに保存
    await jsonpath.write(data);
    versionConfig.set(configkey, await data.hash('sha1'));

    logger.success('load from remote');
    return versions;
  };

export async function getAllLocalVersions<V extends Version>(
  jsonpath: Path,
  configkey: string
) {
  if (!jsonpath.exists()) return;

  const configSha1 = versionConfig.get(configkey);
  const data = await jsonpath.read();
  if (isError(data)) return;

  const dataSha1 = await data.hash('sha1');

  if (configSha1 !== dataSha1) return;

  const vers = await data.json<AllVersion<V['type']>>();
  if (isValid(vers)) return vers;
}
