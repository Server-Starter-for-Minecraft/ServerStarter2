import {
  AllMohistmcVersion,
  MohistmcVersion,
} from 'src-electron/schema/version';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { versionsCachePath } from '../../source/const';
import { BytesData } from '../../util/binary/bytesData';
import { Path } from '../../util/binary/path';
import { Failable } from '../../util/error/failable';
import {
  genGetAllVersions,
  needEulaAgreementVanilla,
  VersionComponent,
  VersionLoader,
} from './base';
import { getJavaComponent } from './vanilla';

const papermcVersionsPath = versionsCachePath.child('mohistmc');

export const mohistmcVersionLoader: VersionLoader<MohistmcVersion> = {
  readyVersion: readyMohistmcVersion,
  getAllVersions: genGetAllVersions<MohistmcVersion>(
    'mohistmc',
    getAllMohistmcVersions
  ),
  needEulaAgreement: needEulaAgreementVanilla,
};

async function readyMohistmcVersion(
  version: MohistmcVersion,
  cwdPath: Path,
  progress?: GroupProgressor
): Promise<Failable<VersionComponent>> {
  progress?.title({
    key: 'server.readyVersion.title',
    args: { version: version },
  });

  const jarpath = cwdPath.child(
    `${version.type}-${version.id}-${version.number}.jar`
  );

  // 適切なjavaのバージョンを取得
  const component = await getJavaComponent(version.id);
  if (isError(component)) return component;

  const r = progress?.subtitle({
    key: 'server.readyVersion.mohistmc.readyServerData',
  });
  const result = await downloadMohistmcVersion(version, jarpath);
  r?.delete();
  if (isError(result)) return result;

  return {
    programArguments: ['-jar', jarpath.absolute().strQuoted()],
    component,
  };
}

async function downloadMohistmcVersion(
  version: MohistmcVersion,
  jarPath: Path
): Promise<Failable<undefined>> {
  // jsonファイルをダウンロード
  const json = await getMohistmcVersionsJson(version.id);
  if (isError(json)) return json;

  const build = json[version.number.toString()];

  // jarファイルを必要に応じてダウンロード
  const jardata = await BytesData.fromPathOrUrl(
    jarPath,
    build.url,
    { type: 'md5', value: build.md5 },
    true
  );
  if (isError(jardata)) return jardata;
}

const VERSIONS_URL = 'https://mohistmc.com/api/versions';

async function getMohistmcVersionsJson(
  id: string
): Promise<Failable<MohistmcApiVersion>> {
  const JSON_URL = `https://mohistmc.com/api/${id}`;
  const jsondata = await BytesData.fromUrlOrPath(
    papermcVersionsPath.child(`mohistmc-${id}.json`),
    JSON_URL
  );
  if (isError(jsondata)) return jsondata;

  const json = await jsondata.json<MohistmcApiVersion>();
  return json;
}

async function getAllMohistmcVersions(): Promise<Failable<AllMohistmcVersion>> {
  // mohistmcが対応しているバージョン一覧を取得
  const data = await BytesData.fromUrlOrPath(
    papermcVersionsPath.child('versions.json'),
    VERSIONS_URL
  );
  if (isError(data)) return data;
  const json = await data.json<string[]>();
  if (isError(json)) return json;

  // それぞれのバージョンのビルド一覧を取得
  const promisses = json.reverse().map((id) => getMohistmcVersions(id));

  // 並列待機
  const nestedVersion = await Promise.all(promisses);

  // flatMap
  const versions = nestedVersion.filter(isValid).flatMap((x) => x);

  return versions;
}

async function getMohistmcVersions(
  id: string
): Promise<Failable<AllMohistmcVersion[number]>> {
  const json = await getMohistmcVersionsJson(id);
  if (isError(json)) return json;

  const builds = Object.values(json)
    .filter((v) => v.status === 'SUCCESS')
    .reverse()
    .map(({ forge_version, number }) => ({
      number,
      forge_version: forge_version === 'unknown' ? undefined : forge_version,
    }));

  return {
    id,
    builds,
  };
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
