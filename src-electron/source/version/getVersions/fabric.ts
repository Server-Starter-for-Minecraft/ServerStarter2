import { z } from 'zod';
import { Failable } from 'app/src-electron/schema/error';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { AllFabricVersion, VersionId } from '../../../schema/version';
import { VersionListLoader } from './base';
import { getVersionMainfest } from './manifest';

// FabricのLoader一覧
const loadersURL = 'https://meta.fabricmc.net/v2/versions/loader';
const loaderJsonZod = z
  .object({
    separator: z.string(),
    build: z.number(),
    maven: z.string(),
    version: z.string(),
    stable: z.boolean(),
  })
  .array();

// FabricのInstaller一覧
const installersURL = 'https://meta.fabricmc.net/v2/versions/installer';
const installerJsonZod = z
  .object({
    url: z.string(),
    maven: z.string(),
    version: z.string(),
    stable: z.boolean(),
  })
  .array();

// Fabricのバージョン一覧
const gamesURL = 'https://meta.fabricmc.net/v2/versions/game';
const gamesJsonZod = z
  .object({
    version: VersionId,
    stable: z.boolean(),
  })
  .array();

/**
 * Fabric版のVersionLoaderを作成
 */
export class FabricVersionLoader extends VersionListLoader<'fabric'> {
  constructor(cachePath: Path) {
    super(cachePath, 'fabric', AllFabricVersion);
  }
  async getFromURL() {
    const [games, loaders, installers] = await Promise.all([
      this.getGames(),
      this.getLoaders(),
      this.getInstallers(),
    ]);
    if (isError(games)) return games;
    if (isError(loaders)) return loaders;
    if (isError(installers)) return installers;

    return { games, loaders, installers };
  }

  private async getLoaders(): Promise<Failable<AllFabricVersion['loaders']>> {
    const loadersByte = await BytesData.fromURL(loadersURL);
    if (isError(loadersByte)) return loadersByte;
    const loaders = await loadersByte.json(loaderJsonZod);
    if (isError(loaders)) return loaders;

    return loaders
      .filter(({ version }) => {
        const [, major] = version.split('.');
        return Number.parseInt(major) >= 12;
      })
      .map(({ version, stable }) => {
        return { version, stable };
      });
  }

  private async getInstallers(): Promise<
    Failable<AllFabricVersion['installers']>
  > {
    const installersByte = await BytesData.fromURL(installersURL);
    if (isError(installersByte)) return installersByte;
    const installers = await installersByte.json(installerJsonZod);
    if (isError(installers)) return installers;

    return installers
      .filter(({ version }) => {
        const [, major] = version.split('.');
        return Number.parseInt(major) >= 8;
      })
      .map(({ version, stable }) => {
        return { version, stable };
      });
  }

  private async getGames(): Promise<Failable<AllFabricVersion['games']>> {
    const gamesByte = await BytesData.fromURL(gamesURL);
    if (isError(gamesByte)) return gamesByte;
    const games = await gamesByte.json(gamesJsonZod);
    if (isError(games)) return games;

    const manifest = await getVersionMainfest(this.cachePath, true);
    if (isError(manifest)) return manifest;

    return games
      .map(({ version }) => {
        const vanillaver = manifest.versions.find(({ id }) => id === version);
        if (vanillaver === undefined) return vanillaver;
        const { id, type } = vanillaver;
        return { id, release: type === 'release' };
      })
      .filter((v) => v !== void 0);
  }
}
