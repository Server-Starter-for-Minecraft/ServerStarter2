import { PapermcVersion } from 'app/src-electron/api/scheme';
import { isFailure } from '../../../api/failable';
import { BytesData } from '../../utils/bytesData/bytesData';
import { getJavaComponent } from './vanilla';
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
  async readyVersion(version: PapermcVersion) {
    const versionPath = papermcVersionsPath.child(version.id);
    const serverCwdPath = versionPath;
    const jarpath = versionPath.child(`${version.id}.jar`);

    // 適切なjavaのバージョンを取得
    const component = await getJavaComponent(version.id);
    if (isFailure(component)) return component;

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
      programArguments: ['-jar', '"' + jarpath.absolute().str() + '"'],
      serverCwdPath,
      component,
    };
  },

  /** papermcのバージョンの一覧返す */
  async getAllVersions() {
    const VERSION_LIST_URL = 'https://api.papermc.io/v2/projects/paper';
    const data = await BytesData.fromURL(VERSION_LIST_URL);
    if (isFailure(data)) return data;

    const json = await data.json<PapermcVersions>();
    if (isFailure(json)) return json;

    return json.versions.map((id) => ({ id, release: true, type: 'papermc' }));
  },
};
