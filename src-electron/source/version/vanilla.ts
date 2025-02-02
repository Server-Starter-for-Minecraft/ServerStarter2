import { AllVanillaVersion, VanillaVersion } from 'src-electron/schema/version';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { versionsCachePath } from '../../source/const';
import { BytesData } from '../../util/bytesData';
import { Failable } from '../../util/error/failable';
import { Path } from '../../util/path';
import { GroupProgressor } from '../progress/progress';
import {
  genGetAllVersions,
  needEulaAgreementVanilla,
  VersionLoader,
} from './base';
import { getVersionMainfest } from './mainfest';

const vanillaVersionsPath = versionsCachePath.child('vanilla');

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

export const vanillaVersionLoader: VersionLoader<VanillaVersion> = {
  /** vanillaのサーバーデータを必要があればダウンロード */
  async readyVersion(
    version: VanillaVersion,
    cwdPath: Path,
    progress?: GroupProgressor
  ) {
    progress?.title({
      key: 'server.readyVersion.title',
      args: { version: version },
    });

    const jarpath = cwdPath.child(`${version.type}-${version.id}.jar`);

    // versionのjsonを取得
    const json = await getVanillaVersionJson(version.id);
    if (isError(json)) return json;

    // jarデータを取得
    const f = progress?.subtitle({
      key: 'server.readyVersion.vanilla.fetching',
    });
    const serverData = await BytesData.fromPathOrUrl(
      jarpath,
      json.downloads.server.url,
      {
        type: 'sha1',
        value: json.downloads.server.sha1,
      },
      true
    );
    f?.delete();

    // serverデータがダウロードできなかった場合
    if (isError(serverData)) return serverData;

    // serverデータをファイルに書き出し
    const s = progress?.subtitle({
      key: 'server.readyVersion.vanilla.saving',
    });
    await jarpath.write(serverData);
    s?.delete();

    return {
      programArguments: ['-jar', jarpath.absolute().strQuoted()],
      component: json.javaVersion?.component ?? 'jre-legacy',
    };
  },

  /** バニラのバージョンの一覧返す */
  getAllVersions: genGetAllVersions<VanillaVersion>(
    'vanilla',
    getAllVanillaVersions
  ),

  needEulaAgreement: needEulaAgreementVanilla,
};

async function getAllVanillaVersions(): Promise<Failable<AllVanillaVersion>> {
  const manifest = await getVersionMainfest();
  if (isError(manifest)) return manifest;

  // 1.2.5以前はマルチサーバーが存在しない
  const lastindex = manifest.versions.findIndex((x) => x.id === '1.2.5');
  const multiPlayableVersions = manifest.versions.slice(0, lastindex);

  return multiPlayableVersions.map((x) => ({
    release: x.type === 'release',
    id: x.id,
  }));
}

/** バージョンのIDに適したjavaのコンポーネントを返す */
export async function getJavaComponent(id: string) {
  // versionのjsonを取得
  // TODO: serverがないバージョンまで選択されていると思うのでそれの排除
  const json = await getVanillaVersionJson(id);
  if (isError(json)) return json;

  return json.javaVersion?.component ?? 'jre-legacy';
}

// バージョンidでバニラのバージョンを検索
export async function getVanillaVersionJson(
  id: string
): Promise<Failable<VanillaVersionJson>> {
  const jsonpath = vanillaVersionsPath.child(`vanilla-${id}.json`);
  const manifest = await getVersionMainfest();

  // version manifestが取得できなかった場合
  if (isError(manifest)) return manifest;

  const record = manifest.versions.find((version) => version.id === id);

  // 該当idのバージョンが存在しない場合
  if (record === undefined)
    return errorMessage.core.version.vanillaVersionNotExists({ version: id });

  // jsonデータを取得
  const jsonData = await BytesData.fromUrlOrPath(jsonpath, record.url, {
    type: 'sha1',
    value: record.sha1,
  });

  // jsonデータが取得できなかった場合
  if (isError(jsonData)) return jsonData;

  const json = await jsonData.json<VanillaVersionJson>();

  return json;
}
