import { Failable, isFailure } from 'app/src-electron/api/failable';
import { BytesData } from '../../utils/bytesData/bytesData';
import { VersionComponent, VersionLoader } from './interface';
import { MohistmcVersion } from 'app/src-electron/api/scheme';
import { versionsPath } from '../const';
import { getJavaComponent } from './vanilla';

const papermcVersionsPath = versionsPath.child('mohistmc');

export const mohistmcVersionLoader: VersionLoader = {
  readyVersion: readyMohistmcVersion,
  getAllVersions: getAllMohistmcVersions,
};

async function readyMohistmcVersion(
  version: MohistmcVersion
): Promise<Failable<VersionComponent>> {
  const versionPath = papermcVersionsPath.child(version.id);
  const serverCwdPath = versionPath;
  const jarpath = versionPath.child(`${version.id}.jar`);

  // 適切なjavaのバージョンを取得
  const component = await getJavaComponent(version.id);
  if (isFailure(component)) return component;

  if (!jarpath.exists()) {
    // jarファイルをダウンロード
    const JAR_URL = `https://mohistmc.com/api/${version.id}/latest/download`;

    const jardata = await BytesData.fromURL(JAR_URL);
    if (isFailure(jardata)) return jardata;

    await jarpath.write(jardata);
  }

  return {
    programArguments: ['-jar', '"' + jarpath.absolute().str() + '"'],
    serverCwdPath,
    component,
  };
}

const VERSIONS_URL = 'https://mohistmc.com/api/versions';

async function getAllMohistmcVersions(): Promise<Failable<MohistmcVersion[]>> {
  const versionData = await BytesData.fromURL(VERSIONS_URL);
  if (isFailure(versionData)) return versionData;

  const json = await versionData.json<string[]>();
  if (isFailure(json)) return json;

  return json.map((id) => ({
    id,
    type: 'mohistmc',
    release: true,
  }));
}
