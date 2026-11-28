import { Failable } from '../schema/error';
import { AllVersion, VersionType } from '../schema/version';
import { runtimePath, versionsCachePath } from './const';
import { getUniversalConfig } from './runtime/getUnivConfig';
import { RuntimeContainer } from './runtime/runtime';
import { VersionContainer } from './version/version';

/**
 * バックエンドの処理（source）で共有するインスタンス
 *
 * Java のランタイムとサーバーのバージョンの一覧は，取得したものをキャッシュして使い回す
 */
export const runtimeContainer = new RuntimeContainer(
  runtimePath,
  getUniversalConfig
);
export const versionContainer = new VersionContainer(versionsCachePath);

/**
 * API呼び出し用
 */
export const getVersions = async <V extends VersionType>(
  type: V,
  useCache: boolean
): Promise<Failable<AllVersion<V>>> => {
  const container = new VersionContainer(versionsCachePath);
  return container.listVersions(type, useCache);
};
