import { VanillaVersion } from 'app/src-electron/api/scheme';
import { getVersionMainfest } from './mainfest';
import { isFailure } from '../../utils/result';
import { BytesData } from '../../utils/bytesData/bytesData';
import { Path } from '../../utils/path/path';

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
  javaVersion: {
    component: JavaComponent;
    majorVersion: number;
  };
};

/** vanillaのサーバーデータをダウンロード */
export async function readyVanillaVersion(
  vanillaVersionsPath: Path,
  version: VanillaVersion
) {
  const path = vanillaVersionsPath.child(version.id);
  const jsonpath = path.child(version.id + '.json');
  const jarpath = path.child(version.id + '.jar');
  const manifest = await getVersionMainfest();

  // version manifestが取得できなかった場合
  if (isFailure(manifest)) return manifest;

  const record = manifest.versions.find((version) => version.id === version.id);

  // 該当idのバージョンが存在しない場合
  if (record === undefined)
    return new Error(`Vanilla version ${version.id} is not exists`);

  // jsonデータを取得
  const jsonData = await BytesData.fromPathOrUrl(
    jsonpath.path,
    record.url,
    record.sha1
  );

  // jsonデータが取得できなかった場合
  if (isFailure(jsonData)) return jsonData;

  const json = await jsonData.json<VanillaVersionJson>();

  // jsonデータに変換できなかった場合
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

  console.log(serverData);

  return {
    jarpath,
    component: json.javaVersion.component,
  };
}
