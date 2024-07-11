import { z } from 'zod';
import { ok, Result } from 'app/src-electron/v2/util/base';
import { Bytes } from 'app/src-electron/v2/util/binary/bytes';
import { Url } from 'app/src-electron/v2/util/binary/url';
import { JsonSourceHandler } from 'app/src-electron/v2/util/wrapper/jsonFile';
import { AllFabricVersion, VersionId } from '../../../schema/version';
import {
  getFromCacheBase,
  getVersionCacheFilePath,
  VersionListLoader,
} from './base';
import { getVersionMainfest } from './mainfest';

const fabricVerZod = z.object({
  games: z
    .object({
      id: z.string().transform((ver) => ver as VersionId),
      release: z.boolean(),
    })
    .array(),
  loaders: z
    .object({
      version: z.string(),
      stable: z.boolean(),
    })
    .array(),
  installers: z
    .object({
      version: z.string(),
      stable: z.boolean(),
    })
    .array(),
  builds: z.number().array(),
});

/**
 * Fabricにおける`all.json`を定義
 */
const allFabricsHandler = JsonSourceHandler.fromPath<AllFabricVersion>(
  getVersionCacheFilePath('fabric'),
  fabricVerZod
);

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
    version: z.string().transform((v) => v as VersionId),
    stable: z.boolean(),
  })
  .array();

/**
 * Fabric版のVersionLoaderを作成
 */
export function getFabricVersionLoader(): VersionListLoader<AllFabricVersion> {
  return {
    getFromCache: () => getFromCacheBase('fabric', allFabricsHandler),
    getFromURL: async (): Promise<Result<AllFabricVersion>> => {
      const [games, loaders, installers] = await Promise.all([
        getGames(),
        getLoaders(),
        getInstallers(),
      ]);
      if (games.isErr) return games;
      if (loaders.isErr) return loaders;
      if (installers.isErr) return installers;

      return ok({
        games: games.value(),
        loaders: loaders.value(),
        installers: installers.value(),
      });
    },
    write4Cache: (obj) => {
      return allFabricsHandler.write(obj);
    },
  };
}

async function getLoaders(): Promise<Result<AllFabricVersion['loaders']>> {
  const loaders = (await new Url(loadersURL).into(Bytes)).onOk((val) =>
    val.toStr()
  );
  if (loaders.isErr) return loaders;

  const parsedLoaders = Result.catchSync(() =>
    loaderJsonZod.parse(JSON.parse(loaders.value()))
  );
  if (parsedLoaders.isErr) return parsedLoaders;

  return ok(
    parsedLoaders
      .value()
      .filter(({ version }) => {
        const [, major] = version.split('.');
        return Number.parseInt(major) >= 12;
      })
      .map(({ version, stable }) => {
        return { version, stable };
      })
  );
}

async function getInstallers(): Promise<
  Result<AllFabricVersion['installers']>
> {
  const installers = (await new Url(installersURL).into(Bytes)).onOk((val) =>
    val.toStr()
  );
  if (installers.isErr) return installers;

  const parsedInstallers = Result.catchSync(() =>
    installerJsonZod.parse(JSON.parse(installers.value()))
  );
  if (parsedInstallers.isErr) return parsedInstallers;

  return ok(
    parsedInstallers
      .value()
      .filter(({ version }) => {
        const [, major] = version.split('.');
        return Number.parseInt(major) >= 8;
      })
      .map(({ version, stable }) => {
        return { version, stable };
      })
  );
}

async function getGames(): Promise<Result<AllFabricVersion['games']>> {
  const games = (await new Url(gamesURL).into(Bytes)).onOk((val) =>
    val.toStr()
  );
  if (games.isErr) return games;

  const parsedGames = Result.catchSync(() =>
    gamesJsonZod.parse(JSON.parse(games.value()))
  );
  if (parsedGames.isErr) return parsedGames;

  const manifest = await getVersionMainfest(true);
  if (manifest.isErr) return manifest;

  return ok(
    parsedGames
      .value()
      .map(({ version }) => {
        const vanillaver = manifest
          .value()
          .versions.find(({ id }) => id === version);
        if (vanillaver === undefined) return vanillaver;
        const { id, type } = vanillaver;
        return { id, release: type === 'release' };
      })
      .filter((v) => v !== void 0)
  );
}
