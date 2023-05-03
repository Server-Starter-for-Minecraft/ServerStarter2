import { PapermcVersion } from 'src-electron/api/schema';
import { Failable, isFailure, isSuccess } from '../../api/failable';
import { BytesData } from '../../util/bytesData';
import { getJavaComponent } from './vanilla';
import { versionsCachePath } from '../const';
import { VersionLoader, genGetAllVersions } from './base';
import { Path } from '../../util/path';

const papermcVersionsPath = versionsCachePath.child('papermc');

type PapermcVersions = {
  project_id: 'paper';
  project_name: 'Paper';
  version_groups: string[];
  versions: string[];
};

export const papermcVersionLoader: VersionLoader<PapermcVersion> = {
  /** papermcのサーバーデータを必要があればダウンロード */
  readyVersion: readyVersion,

  /** papermcのバージョンの一覧返す */
  getAllVersions: genGetAllVersions('papermc', getPapermcVersions),
};

async function getPapermcVersions(): Promise<Failable<PapermcVersion[]>> {
  const VERSION_LIST_URL = 'https://api.papermc.io/v2/projects/paper';
  const data = await BytesData.fromURL(VERSION_LIST_URL);
  if (isFailure(data)) return data;

  const json = await data.json<PapermcVersions>();
  if (isFailure(json)) return json;

  const promisses = json.versions.reverse().map(getPapermcBuilds);

  const results = await Promise.all(promisses);

  return results.filter(isSuccess).flatMap((x) => x);
}

type ApiBuilds = {
  project_id: 'paper';
  project_name: 'Paper';
  version: string;
  builds: number[];
};

async function getPapermcBuilds(
  version: string
): Promise<Failable<PapermcVersion[]>> {
  const url = `https://api.papermc.io/v2/projects/paper/versions/${version}`;
  const data = await BytesData.fromURL(url);
  if (isFailure(data)) return data;

  const json = await data.json<ApiBuilds>();
  if (isFailure(json)) return json;

  return json.builds.map((build) => ({ id: version, type: 'papermc', build }));
}

type ApiBuild = {
  project_id: 'paper';
  project_name: 'Paper';
  version: string;
  build: number;
  time: string;
  channel: 'default';
  promoted: boolean;
  downloads: {
    application: {
      name: string;
      sha256: string;
    };
  };
};

async function readyVersion(version: PapermcVersion, cwdPath: Path) {
  const jarpath = cwdPath.child(
    `${version.type}-${version.id}-${version.build}.jar`
  );

  const buildURL = `https://api.papermc.io/v2/projects/paper/versions/${version.id}/builds/${version.build}`;
  const jsonpath = papermcVersionsPath.child(
    `${version.id}/${version.build}.json`
  );
  const jsonResponse = await BytesData.fromUrlOrPath(jsonpath, buildURL);
  if (isFailure(jsonResponse)) return jsonResponse;

  const json = await jsonResponse.json<ApiBuild>();
  if (isFailure(json)) return json;

  const { name, sha256 } = json.downloads.application;

  const jarURL = buildURL + `/downloads/${name}`;

  const jarResponse = await BytesData.fromPathOrUrl(
    jarpath,
    jarURL,
    { type: 'sha256', value: sha256 },
    true
  );
  if (isFailure(jarResponse)) return jarResponse;

  // 適切なjavaのバージョンを取得
  const component = await getJavaComponent(version.id);
  if (isFailure(component)) return component;

  return {
    programArguments: ['-jar', '"' + jarpath.absolute().str() + '"'],
    component,
  };
}
