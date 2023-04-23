import { Version, VersionType } from 'app/src-electron/api/scheme';
import { Path } from '../../utils/path/path';
import { JavaComponent } from './vanilla';
import { Failable, isFailure, isSuccess } from '../../../api/failable';
import { versionsPath } from '../const';
import { config } from '../../config';
import { BytesData } from '../../utils/bytesData/bytesData';
import { rootLoggers } from '../../logger';

export const versionLoggers = rootLoggers.child('version');

export type VersionComponent = {
  programArguments: string[];
  serverCwdPath: Path;
  component: JavaComponent;
};

export type VersionLoader = {
  readyVersion(version: Version): Promise<Failable<VersionComponent>>;
  getAllVersions(useCache: boolean): Promise<Failable<Version[]>>;
  defineLevelName(
    worldPath: Path,
    serverCwdPath: Path
  ): Promise<Failable<{ levelName: string; args: string[] }>>;
};

export const genGetAllVersions = <V extends Version>(
  type: V["type"],
  getAllVersionsFromRemote: () => Promise<Failable<V[]>>
) =>
  async function result(useCache: boolean) {
    const logger = versionLoggers.operation('getAllVersions', {
      type,
      useCache,
    });
    logger.start();

    const jsonpath = versionsPath.child(`${type}/${type}-all.json`);
    const configkey = `versions_sha1.${type}`;

    if (useCache) {
      // ローカルから読み込み
      const versions = await getAllLocalVersions(type, jsonpath, configkey);
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
    config.set(configkey, await data.sha1());

    logger.success('load from remote');
    return versions;
  };

export async function getAllLocalVersions<V extends Version>(
  type: VersionType,
  jsonpath: Path,
  configkey: string
) {
  if (!jsonpath.exists()) return;

  const configSha1 = config.get(`versions_sha1.${type}`);
  const data = await jsonpath.read();
  if (isFailure(data)) return;

  const dataSha1 = await data.sha1();

  if (configSha1 !== dataSha1) return;

  const vers = await data.json<V[]>();
  if (isSuccess(vers)) return vers;
}
