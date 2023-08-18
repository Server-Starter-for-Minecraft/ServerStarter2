import { AllFabricVersion, FabricVersion } from 'src-electron/schema/version';
import { BytesData } from '../../util/bytesData';
import { getJavaComponent, vanillaVersionLoader } from './vanilla';
import { versionsCachePath } from '../const';
import {
  VersionLoader,
  genGetAllVersions,
  needEulaAgreementVanilla,
} from './base';
import { Path } from '../../util/path';
import { isError } from 'app/src-electron/util/error/error';
import { GroupProgressor } from '../progress/progress';
import { Failable } from 'app/src-electron/schema/error';

const fabricVersionsPath = versionsCachePath.child('fabric');

export const fabricVersionLoader: VersionLoader<FabricVersion> = {
  /** fabricのサーバーデータを必要に応じてダウンロード */
  readyVersion: readyVersion,

  /** fabricのバージョンの一覧返す */
  // TODO: jsonの内容がとてつもなく冗長になってしまっている
  getAllVersions: genGetAllVersions<FabricVersion>('fabric', getAllVersions),

  needEulaAgreement: needEulaAgreementVanilla,
};

async function readyVersion(
  version: FabricVersion,
  cwdPath: Path,
  progress?: GroupProgressor
) {
  progress?.title({
    key: 'server.readyVersion.title',
    args: { version: version },
  });

  const url = `https://meta.fabricmc.net/v2/versions/loader/${version.id}/${version.loader}/${version.installer}/server/jar`;
  const jarpath = cwdPath.child(
    `fabric-${version.id}-${version.loader}-${version.installer}.jar`
  );

  progress?.subtitle({
    key: 'server.readyVersion.fabric.readyServerData',
  });
  const result = await BytesData.fromPathOrUrl(jarpath, url, undefined, false);

  if (isError(result)) return result;

  const javaComponent = await getJavaComponent(version.id);
  if (isError(javaComponent)) return javaComponent;

  return {
    programArguments: ['-jar', jarpath.absolute().strQuoted()],
    component: javaComponent,
  };
}

// TODO: ローカルに保存
async function getAllVersions(): Promise<Failable<AllFabricVersion>> {
  const [gameValues, loaders, installers] = await Promise.all([
    getGames(),
    getLoaders(),
    getInstallers(),
  ]);
  if (isError(gameValues)) return gameValues;
  if (isError(loaders)) return loaders;
  if (isError(installers)) return installers;

  const games = gameValues.flatMap(({ id, release }) => ({
    id,
    release,
  }));
  return {
    games,
    loaders,
    installers,
  };
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
  const data = await BytesData.fromUrlOrPath(
    fabricVersionsPath.child('loader.json'),
    URL
  );
  if (isError(data)) return data;

  const loaders = await data.json<Loader[]>();
  if (isError(loaders)) return loaders;

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
  const data = await BytesData.fromUrlOrPath(
    fabricVersionsPath.child('installer.json'),
    URL
  );
  if (isError(data)) return data;

  const loaders = await data.json<Installer[]>();
  if (isError(loaders)) return loaders;

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
  const data = await BytesData.fromUrlOrPath(
    fabricVersionsPath.child('game.json'),
    URL
  );
  if (isError(data)) return data;

  const games = await data.json<Game[]>();
  if (isError(games)) return games;

  const vanilla = await vanillaVersionLoader.getAllVersions(undefined);
  if (isError(vanilla)) return vanilla;

  return games
    .map(({ version }) => {
      const vanillaver = vanilla.find(({ id }) => id === version);
      if (vanillaver === undefined) return vanillaver;
      const { id, release } = vanillaver;
      return { id, release };
    })
    .filter((v): v is { id: string; release: boolean } => v !== undefined);
}
