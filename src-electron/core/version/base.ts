import { Version, VersionType } from 'src-electron/api/schema';
import { Path } from '../../util/path';
import { JavaComponent } from './vanilla';
import { Failable, isFailure, isSuccess } from '../../api/failable';
import { versionsCachePath } from '../const';
import { config } from '../stores/config';
import { BytesData } from '../../util/bytesData';
import { rootLoggerHierarchy } from '../logger';
import { eulaUnnecessaryVersionIds } from './const';

export const versionLoggers = rootLoggerHierarchy.server.version;

export type VersionComponent = {
  programArguments: string[];
  component: JavaComponent;
};

export type VersionLoader<V extends Version> = {
  readyVersion(version: V, cwdPath: Path): Promise<Failable<VersionComponent>>;

  /**
   * @param useCache ローカルのキャッシュを使用するかどうか
   *
   * - true      ローカルにキャッシュがあれば使用(最新版でない可能性あり) 速い
   * - false     必ずリモートから最新版を取得(必ず最新版) 遅い
   * - undefined 起動中にリモートから取得済みだったらローカルを使用(おそらく最新版) 初回だけ遅い
   */
  getAllVersions(useCache: boolean | undefined): Promise<Failable<V[]>>;

  /** サーバーの起動にminecraft Eulaへの同意が必要かどうか */
  needEulaAgreement(version: V): boolean;
};

export function needEulaAgreementVanilla(version: Version) {
  // 1.17.10-pre1以前はfalse
  return !eulaUnnecessaryVersionIds.includes(version.id);
}

const allVersionsReloadedMap: { [key in VersionType]: boolean } = {
  fabric: false,
  forge: false,
  mohistmc: false,
  papermc: false,
  spigot: false,
  vanilla: false,
};

export const genGetAllVersions = <V extends Version>(
  type: V['type'],
  getAllVersionsFromRemote: () => Promise<Failable<V[]>>
) =>
  async function result(useCache: boolean | undefined): Promise<Failable<V[]>> {
    // ローカルのデータが最新版ならローカルのデータを使う
    if (useCache === undefined) {
      useCache = allVersionsReloadedMap[type];
    }

    const logger = versionLoggers.getAllVersions({ type, useCache });
    logger.start();

    const jsonpath = versionsCachePath.child(`${type}/${type}-all.json`);
    const configkey = `versions_sha1.${type}`;

    if (useCache) {
      // ローカルから読み込み
      const versions = await getAllLocalVersions<V>(type, jsonpath, configkey);
      if (versions !== undefined) {
        logger.success('load from local');
        return versions;
      }
    }

    const versions = await getAllVersionsFromRemote();
    if (isFailure(versions)) {
      logger.fail(versions);
      return versions;
    }

    const data = await BytesData.fromText(JSON.stringify(versions));
    if (isFailure(data)) {
      logger.fail(data);
      return data;
    }

    // 結果をローカルに保存
    await jsonpath.write(data);
    config.set(configkey, await data.hash('sha1'));

    allVersionsReloadedMap[type] = true;

    logger.success('load from remote');
    return versions;
  };

export async function getAllLocalVersions<V extends Version>(
  type: VersionType,
  jsonpath: Path,
  configkey: string
) {
  if (!jsonpath.exists()) return;

  const configSha1 = config.get(configkey);
  const data = await jsonpath.read();
  if (isFailure(data)) return;

  const dataSha1 = await data.hash('sha1');

  if (configSha1 !== dataSha1) return;

  const vers = await data.json<V[]>();
  if (isSuccess(vers)) return vers;
}
