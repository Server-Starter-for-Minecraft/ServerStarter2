import { AllPapermcVersion, PapermcVersion } from 'src-electron/schema/version';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { BytesData } from '../../util/bytesData';
import { Failable } from '../../util/error/failable';
import { Path } from '../../util/path';
import { versionsCachePath } from '../const';
import { GroupProgressor } from '../progress/progress';
import {
  genGetAllVersions,
  needEulaAgreementVanilla,
  VersionLoader,
} from './base';
import { getJavaComponent } from './vanilla';

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
  getAllVersions: genGetAllVersions<PapermcVersion>(
    'papermc',
    getPapermcVersions
  ),

  needEulaAgreement: needEulaAgreementVanilla,
};

async function getPapermcVersions(): Promise<Failable<AllPapermcVersion>> {
  const VERSION_LIST_URL = 'https://api.papermc.io/v2/projects/paper';
  const data = await BytesData.fromURL(VERSION_LIST_URL);
  if (isError(data)) return data;

  const json = await data.json<PapermcVersions>();
  if (isError(json)) return json;

  const promisses = json.versions.reverse().map(getPapermcBuilds);

  const results = await Promise.all(promisses);

  return results.filter(isValid);
}

type ApiBuilds = {
  project_id: 'paper';
  project_name: 'Paper';
  version: string;
  builds: number[];
};

async function getPapermcBuilds(
  version: string
): Promise<Failable<AllPapermcVersion[number]>> {
  const url = `https://api.papermc.io/v2/projects/paper/versions/${version}`;
  const data = await BytesData.fromURL(url);
  if (isError(data)) return data;

  const json = await data.json<ApiBuilds>();
  if (isError(json)) return json;

  return { id: version, builds: json.builds.reverse() };
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

async function readyVersion(
  version: PapermcVersion,
  cwdPath: Path,
  progress?: GroupProgressor
) {
  progress?.title({
    key: 'server.readyVersion.title',
    args: { version: version },
  });

  const jarpath = cwdPath.child(
    `${version.type}-${version.id}-${version.build}.jar`
  );

  const buildURL = `https://api.papermc.io/v2/projects/paper/versions/${version.id}/builds/${version.build}`;
  const jsonpath = papermcVersionsPath.child(
    `${version.id}/${version.build}.json`
  );

  const l = progress?.subtitle({
    key: 'server.readyVersion.papermc.loadBuildData',
  });
  const jsonResponse = await BytesData.fromUrlOrPath(jsonpath, buildURL);
  if (isError(jsonResponse)) return jsonResponse;

  const json = await jsonResponse.json<ApiBuild>();
  if (isError(json)) return json;
  l?.delete();

  const { name, sha256 } = json.downloads.application;

  const jarURL = `${buildURL}/downloads/${name}`;

  const s = progress?.subtitle({
    key: 'server.readyVersion.papermc.readyServerData',
  });
  const jarResponse = await BytesData.fromPathOrUrl(
    jarpath,
    jarURL,
    { type: 'sha256', value: sha256 },
    true
  );
  if (isError(jarResponse)) return jarResponse;

  // 適切なjavaのバージョンを取得
  const component = await getJavaComponent(version.id);
  if (isError(component)) return component;

  s?.delete();

  return {
    programArguments: ['-jar', jarpath.absolute().strQuoted()],
    component,
  };
}
