import { FabricVersion } from 'app/src-electron/api/scheme';
import { isFailure } from '../../../api/failable';
import { BytesData } from '../../utils/bytesData/bytesData';
import { getJavaComponent, vanillaVersionLoader } from './vanilla';
import { versionsPath } from '../const';
import { VersionLoader, genGetAllVersions } from './base';
import { Path } from '../../utils/path/path';

const fabricVersionsPath = versionsPath.child('fabric');

export const fabricVersionLoader: VersionLoader<FabricVersion> = {
  /** fabricのサーバーデータを必要に応じてダウンロード */
  readyVersion: readyVersion,

  /** fabricのバージョンの一覧返す */
  // TODO: jsonの内容がとてつもなく冗長になってしまっている
  getAllVersions: genGetAllVersions('fabric', getAllVersions),
};

async function readyVersion(version: FabricVersion, cwdPath: Path) {
  const url = `https://meta.fabricmc.net/v2/versions/loader/${version.id}/${version.loader}/${version.installer}/server/jar`;
  const jarpath = cwdPath.child(
    `fabric-${version.id}-${version.loader}-${version.installer}.jar`
  );

  const result = await BytesData.fromPathOrUrl(
    jarpath,
    url,
    undefined,
    false,
    true,
    false
  );

  if (isFailure(result)) return result;

  const javaComponent = await getJavaComponent(version.id);
  if (isFailure(javaComponent)) return javaComponent;

  return {
    programArguments: ['-jar', '"' + jarpath.absolute().str() + '"'],
    component: javaComponent,
  };
}

// TODO: ローカルに保存
async function getAllVersions() {
  const [games, loaders, installers] = await Promise.all([
    getGames(),
    getLoaders(),
    getInstallers(),
  ]);
  if (isFailure(games)) return games;
  if (isFailure(loaders)) return loaders;
  if (isFailure(installers)) return installers;

  const versions: FabricVersion[] = games.flatMap(({ id, release }) =>
    loaders.flatMap((loader) =>
      installers.map((installer) => ({
        type: 'fabric',
        id,
        release,
        loader,
        installer,
      }))
    )
  );
  return versions;
}

type Loader = {
  separator: string;
  build: number;
  maven: string;
  version: string;
  stable: true;
};

async function getLoaders() {
  const URL = 'https://meta.fabricmc.net/v2/versions/loader';
  // TODO: hash対応
  const data = await BytesData.fromPathOrUrl(
    fabricVersionsPath.child(`loader.json`),
    URL,
    undefined,
    true
  );
  if (isFailure(data)) return data;

  const loaders = await data.json<Loader[]>();
  if (isFailure(loaders)) return loaders;

  return loaders
    .filter(({ version }) => {
      const [, major] = version.split('.');
      return Number.parseInt(major) >= 12;
    })
    .map(({ version }) => version);
}

type Installer = {
  url: string;
  maven: string;
  version: string;
  stable: true;
};

async function getInstallers() {
  const URL = 'https://meta.fabricmc.net/v2/versions/installer';
  // TODO: hash対応
  const data = await BytesData.fromPathOrUrl(
    fabricVersionsPath.child(`installer.json`),
    URL,
    undefined,
    true
  );
  if (isFailure(data)) return data;

  const loaders = await data.json<Installer[]>();
  if (isFailure(loaders)) return loaders;

  return loaders
    .filter(({ version }) => {
      const [, major] = version.split('.');
      return Number.parseInt(major) >= 8;
    })
    .map(({ version }) => version);
}

type Game = {
  version: string;
  stable: boolean;
};

async function getGames() {
  const URL = 'https://meta.fabricmc.net/v2/versions/game';
  // TODO: hash対応
  const data = await BytesData.fromPathOrUrl(
    fabricVersionsPath.child(`game.json`),
    URL,
    undefined,
    true
  );
  if (isFailure(data)) return data;

  const games = await data.json<Game[]>();
  if (isFailure(games)) return games;

  const vanilla = await vanillaVersionLoader.getAllVersions(undefined);
  if (isFailure(vanilla)) return vanilla;

  return games
    .map(({ version }) => {
      console.log(version);
      const vanillaver = vanilla.find(({ id }) => id === version);
      if (vanillaver === undefined) return vanillaver;
      const { id, release } = vanillaver;
      return { id, release };
    })
    .filter((v): v is { id: string; release: boolean } => v !== undefined);
}
