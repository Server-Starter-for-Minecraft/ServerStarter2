import { PapermcVersion } from 'app/src-electron/api/scheme';
import { Failable, isFailure } from '../../utils/result';
import { BytesData } from '../../utils/bytesData/bytesData';
import { Path } from '../../utils/path/path';
import { JavaComponent, getVanillaVersionJson } from './vanilla';
import { versionsPath } from '../const';
import { VersionLoader } from './interface';

const papermcVersionsPath = versionsPath.child('papermc');

type PapermcVersions = {
  project_id: 'paper';
  project_name: 'Paper';
  version_groups: string[];
  versions: string[];
};

type PapermcBuilds = {
  project_id: 'paper';
  project_name: 'Paper';
  version: string;
  builds: {
    build: number;
    downloads: {
      application: {
        name: 'paper-1.19.3-368.jar';
      };
    };
  }[];
};

export const papermcVersionLoader: VersionLoader = {
  /** papermcのサーバーデータをダウンロード */
  async readyVersion(
    version: PapermcVersion
  ): Promise<Failable<{ jarpath: Path; component: JavaComponent }>> {
    // javaの実行パスを取得
    const json = await getVanillaVersionJson(version.id);

    // javaの実行パスを取得出来なかった場合
    if (isFailure(json)) return json;

    const jarpath = papermcVersionsPath.child(
      `${version.id}/${version.id}.jar`
    );

    const buildsURL = `https://api.papermc.io/v2/projects/paper/versions/${version.id}/builds`;

    const response = await BytesData.fromURL(buildsURL);
    if (isFailure(response)) return response;

    const buildsJson = await response.json<PapermcBuilds>();
    if (isFailure(buildsJson)) return buildsJson;

    const build = buildsJson.builds[buildsJson.builds.length - 1];

    const build_id = build.build;

    const build_file = build.downloads.application.name;

    const serverURL = `https://api.papermc.io/v2/projects/paper/versions/${version.id}/builds/${build_id}/downloads/${build_file}`;

    const server = await BytesData.fromURL(serverURL);
    if (isFailure(server)) return server;

    // jarファイルを保存
    jarpath.write(server);

    return {
      jarpath,
      component: json.javaVersion.component,
    };
  },
};
