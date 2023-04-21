import { VanillaVersion } from 'app/src-electron/api/scheme';
import { getVersionMainfest } from './mainfest';
import { Failable, isFailure } from '../../../api/failable';
import { BytesData } from '../../utils/bytesData/bytesData';
import { versionsPath } from '../const';
import { VersionLoader } from './interface';

const vanillaVersionsPath = versionsPath.child('vanilla');

export type JavaComponent =
  | 'java-runtime-alpha'
  | 'java-runtime-beta'
  | 'java-runtime-gamma'
  | 'jre-legacy';

export type VanillaVersionJson = {
  downloads: {
    server: {
      sha1: string;
      size: number;
      url: string;
    };
  };
  javaVersion?: {
    component: JavaComponent;
    majorVersion: number;
  };
};

export const vanillaVersionLoader: VersionLoader = {
  /** vanillaのサーバーデータをダウンロード */
  async readyVersion(version: VanillaVersion) {
    const versionPath = vanillaVersionsPath.child(version.id);
    const serverCwdPath = versionPath;
    const jarpath = versionPath.child(version.id + '.jar');

    // versionのjsonを取得
    const json = await getVanillaVersionJson(version.id);
    if (isFailure(json)) return json;

    // jarデータを取得
    const serverData = await BytesData.fromPathOrUrl(
      jarpath.path,
      json.downloads.server.url,
      json.downloads.server.sha1
    );

    // serverデータがダウロードできなかった場合
    if (isFailure(serverData)) return serverData;

    // serverデータをファイルに書き出し
    await jarpath.write(serverData);

    return {
      programArguments: ['-jar', '"' + jarpath.absolute().str() + '"'],
      serverCwdPath,
      component: json.javaVersion?.component ?? 'jre-legacy',
    };
  },

  /** バニラのバージョンの一覧返す */
  async getAllVersions() {
    const manifest = await getVersionMainfest();
    if (isFailure(manifest)) return manifest;

    // 1.2.5以前はマルチサーバーが存在しない
    const lastindex = manifest.versions.findIndex((x) => x.id === '1.2.5');
    const multiPlayableVersions = manifest.versions.slice(0, lastindex);

    return multiPlayableVersions.map((x) => ({
      type: 'vanilla',
      release: x.type === 'release',
      id: x.id,
    }));
  },
};

/** バージョンのIDに適したjavaのコンポーネントを返す */
export async function getJavaComponent(id: string) {
  // versionのjsonを取得
  // TODO: serverがないバージョンまで選択されていると思うのでそれの排除
  const json = await getVanillaVersionJson(id);
  if (isFailure(json)) return json;

  return json.javaVersion?.component ?? 'jre-legacy';
}

export async function getVanillaVersionJson(
  id: string
): Promise<Failable<VanillaVersionJson>> {
  const path = vanillaVersionsPath.child(id);
  const jsonpath = path.child(id + '.json');
  const manifest = await getVersionMainfest();

  // version manifestが取得できなかった場合
  if (isFailure(manifest)) return manifest;

  const record = manifest.versions.find((version) => version.id === id);

  // 該当idのバージョンが存在しない場合
  if (record === undefined)
    return new Error(`Vanilla version ${id} is not exists`);

  // jsonデータを取得
  const jsonData = await BytesData.fromPathOrUrl(
    jsonpath.path,
    record.url,
    record.sha1
  );

  // jsonデータが取得できなかった場合
  if (isFailure(jsonData)) return jsonData;

  const json = await jsonData.json<VanillaVersionJson>();

  return json;
}
