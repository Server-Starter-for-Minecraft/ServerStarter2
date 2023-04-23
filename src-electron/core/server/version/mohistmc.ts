import { Failable, isFailure, isSuccess } from '../../../api/failable';
import { BytesData } from '../../utils/bytesData/bytesData';
import { VersionComponent, VersionLoader, genGetAllVersions } from './base';
import { MohistmcVersion } from 'app/src-electron/api/scheme';
import { versionsPath } from '../const';
import { getJavaComponent } from './vanilla';
import { Path } from '../../utils/path/path';

const papermcVersionsPath = versionsPath.child('mohistmc');

export const mohistmcVersionLoader: VersionLoader = {
  readyVersion: readyMohistmcVersion,
  getAllVersions: genGetAllVersions("mohistmc", getAllMohistmcVersions),
};

async function readyMohistmcVersion(
  version: MohistmcVersion
): Promise<Failable<VersionComponent>> {
  const versionPath = papermcVersionsPath.child(
    `${version.id}-${version.number}`
  );
  const serverCwdPath = versionPath;
  const jarpath = versionPath.child(
    `${version.type}-${version.id}-${version.number}.jar`
  );

  // 適切なjavaのバージョンを取得
  const component = await getJavaComponent(version.id);
  if (isFailure(component)) return component;

  const result = await downloadMohistmcVersion(version, jarpath);
  if (isFailure(result)) return result;

  return {
    programArguments: ['-jar', '"' + jarpath.absolute().str() + '"'],
    serverCwdPath,
    component,
  };
}

async function downloadMohistmcVersion(
  version: MohistmcVersion,
  jarPath: Path
): Promise<Failable<undefined>> {
  // jsonファイルをダウンロード
  const json = await getMohistmcVersionsJson(version.id);
  if (isFailure(json)) return json;

  const build = json[version.number.toString()];

  // jarファイルを必要に応じてダウンロード
  const jardata = await BytesData.fromPathOrUrl(
    jarPath.str(),
    build.url,
    { type: 'md5', value: build.md5 },
    false,
    true,
    true
  );
  if (isFailure(jardata)) return jardata;
}

const VERSIONS_URL = 'https://mohistmc.com/api/versions';

async function getMohistmcVersionsJson(
  id: string
): Promise<Failable<MohistmcApiVersion>> {
  const JSON_URL = `https://mohistmc.com/api/${id}`;
  const jsondata = await BytesData.fromPathOrUrl(
    papermcVersionsPath.child(`mohistmc-${id}.json`).str(),
    JSON_URL,
    undefined,
    true,
    true,
    undefined
  );
  if (isFailure(jsondata)) return jsondata;

  const json = await jsondata.json<MohistmcApiVersion>();
  return json;
}

async function getAllMohistmcVersions(): Promise<Failable<MohistmcVersion[]>> {
  // mohistmcが対応しているバージョン一覧を取得
  const data = await BytesData.fromPathOrUrl(
    papermcVersionsPath.child('versions.json').str(),
    VERSIONS_URL,
    undefined,
    true,
    true,
    undefined
  );
  if (isFailure(data)) return data;
  const json = await data.json<string[]>();
  if (isFailure(json)) return json;

  // それぞれのバージョンのビルド一覧を取得
  const promisses = json.reverse().map((id) => getMohistmcVersions(id));

  // 並列待機
  const nestedVersion = await Promise.all(promisses);

  // flatMap
  const versions = nestedVersion.filter(isSuccess).flatMap((x) => x);

  return versions;
}

async function getMohistmcVersions(
  id: string
): Promise<Failable<MohistmcVersion[]>> {
  const json = await getMohistmcVersionsJson(id);
  if (isFailure(json)) return json;

  return Object.values(json)
    .filter((v) => v.status === 'SUCCESS')
    .map(({ forge_version, number }) => ({
      forge_version,
      id,
      type: 'mohistmc',
      number,
    }));
}

type MohistmcApiBuild = {
  status: 'SUCCESS' | 'FAILURE';
  number: number;
  version: string;
  name: string;
  forge_version: string;
  tinysha: string;
  fullsha: string;
  md5: string;
  url: string;
  mirror: string;
  timeinmillis: number;
  date: string;
  decomposeddate: {
    day: number;
    month: number;
    year: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
};

type MohistmcApiVersion = {
  [key in string]: MohistmcApiBuild;
};
