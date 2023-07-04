import { Path } from '../../util/path';
import { asyncMap } from '../../util/objmap';
import { NEW_WORLD_NAME } from '../const';
import { worldContainerToPath } from './worldContainer';
import {
  World,
  WorldAbbr,
  WorldEdited,
  WorldID,
} from 'src-electron/schema/world';
import { WorldContainer, WorldName } from 'src-electron/schema/brands';
import { vanillaVersionLoader } from '../version/vanilla';
import { getSystemSettings } from '../stores/system';
import { WorldHandler } from './handler';
import { withError } from 'app/src-electron/util/error/witherror';
import { validateNewWorldName } from './name';
import { serverJsonFile } from './files/json';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { Failable, WithError } from 'app/src-electron/schema/error';
import { PlainProgressor } from '../progress/progress';
import { api } from '../api';

export async function getWorldAbbrs(
  worldContainer: WorldContainer
): Promise<WithError<WorldAbbr[]>> {
  const subdir = await worldContainerToPath(worldContainer).iter();
  const results = await asyncMap(subdir, (x) =>
    getWorldAbbr(x, worldContainer)
  );
  return withError(results.filter(isValid), results.filter(isError));
}

export async function getWorldAbbr(
  path: Path,
  worldContainer: WorldContainer
): Promise<Failable<WorldAbbr>> {
  if (!path.isDirectory())
    return errorMessage.data.path.invalidContent.mustBeDirectory({
      type: 'file',
      path: path.path,
    });
  const jsonpath = serverJsonFile.path(path);

  if (!jsonpath.exists())
    return errorMessage.data.path.notFound({
      type: 'file',
      path: jsonpath.path,
    });

  const name = path.basename() as WorldName;
  const container = worldContainer as WorldContainer;

  // WorldHandlerに登録
  const id = WorldHandler.register(name, container);

  const result: WorldAbbr = {
    id,
    name,
    container,
  };

  return result;
}

/** WorldIDからワールドデータ取得 (リモートが存在する場合リモートから読み込む) */
export async function getWorld(
  worldID: WorldID
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return withError(handler);
  return await handler.load();
}

/** WorldIDからワールドデータを更新 (リモートが存在する場合リモートから読み込んだ後にリモートを更新) */
export async function setWorld(
  world: WorldEdited
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(world.id);
  if (isError(handler)) return withError(handler);
  return await handler.save(world);
}

/**
 * ワールドデータを新規生成して返す
 * ワールドのidは呼び出すたびに新しくなる
 */
export async function newWorld(): Promise<WithError<Failable<World>>> {
  const vanillaVersions = await vanillaVersionLoader.getAllVersions(true);
  if (isError(vanillaVersions)) return withError(vanillaVersions);

  // TODO: なぜかFailableが消えない
  const latestRelease = vanillaVersions.find((ver) => ver.release);

  const systemSettings = await getSystemSettings();

  if (latestRelease === undefined)
    throw new Error('Assertion: This error cannot occur');

  const container = systemSettings.container.default;
  const name = await getDefaultWorldName(container);

  // WorldHandlerに登録
  const id = WorldHandler.register(name, container);

  const world: World = {
    name,
    container,
    id,
    version: latestRelease,
    using: false,
    remote: undefined,
    last_date: undefined,
    last_user: undefined,
    memory: systemSettings.world.memory,
    javaArguments: systemSettings.world.javaArguments,
    properties: systemSettings.world.properties,
    players: [],
    additional: {
      datapacks: [],
      plugins: [],
      mods: [],
    },
  };

  return withError(world);
}

/** 新規作成する際のワールド名を取得 */
async function getDefaultWorldName(container: WorldContainer) {
  let worldName = NEW_WORLD_NAME;

  let result = await validateNewWorldName(container, worldName);
  let i = 0;
  while (isError(result)) {
    worldName = `${NEW_WORLD_NAME}_${i}`;
    i += 1;
    result = await validateNewWorldName(container, worldName);
  }
  return result;
}

/**
 * ワールドデータ(ディレクトリとfile)を生成する
 * 注：newWorld()によって生成されたものに限る
 */
export async function createWorld(
  world: WorldEdited
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(world.id);
  if (isError(handler)) return withError(handler);
  return await handler.create(world);
}

/**
 * ワールドデータを削除する
 */
export async function deleteWorld(
  worldID: WorldID
): Promise<WithError<Failable<undefined>>> {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return withError(handler);
  return await handler.delete();
}

/**
 * ワールドを起動する
 */
export async function runWorld(
  worldID: WorldID
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return withError(handler);

  const progress = new PlainProgressor(
    (progress) => api.send.Progress(worldID, progress),
    {
      title: {
        key: 'server.preparing',
        args: {
          world: handler.name,
          container: handler.container,
        },
      },
    }
  );

  return await handler.run(progress);
}

/**
 * コマンドを実行する
 */
export function runCommand(worldID: WorldID, command: string): void {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return;
  handler.runCommand(command);
}
