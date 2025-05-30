import { WorldContainer, WorldName } from 'src-electron/schema/brands';
import {
  World,
  WorldAbbr,
  WorldEdited,
  WorldID,
} from 'src-electron/schema/world';
import { versionContainer } from 'app/src-electron/core/setup';
import { Failable, WithError } from 'app/src-electron/schema/error';
import { BackupData } from 'app/src-electron/schema/filedata';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { withError } from 'app/src-electron/util/error/witherror';
import { getCurrentTimestamp } from 'app/src-electron/util/timestamp';
import { WorldProgressor } from '../../common/progress';
import { NEW_WORLD_NAME } from '../../source/const';
import { getSystemSettings } from '../../source/stores/system';
import { Path } from '../../util/binary/path';
import { asyncMap } from '../../util/obj/objmap';
import { serverJsonFile } from './files/json';
import { WorldHandler } from './handler';
import { WorldLogHandler } from './loghandler';
import { validateNewWorldName } from './name';
import { worldContainerToPath } from './worldContainer';

export async function getWorldAbbrs(
  worldContainer: WorldContainer
): Promise<WithError<WorldAbbr[]>> {
  const dir = worldContainerToPath(worldContainer);
  const subdir = await dir.iter();
  if (isError(subdir)) return withError([], [subdir]);

  const results = await asyncMap(subdir, (x) =>
    getWorldAbbr(x, worldContainer)
  );
  // ワールドが一つもない場合はディレクトリを削除(設定からは削除しない)
  if (subdir.length === 0) dir.remove();

  return withError(results.filter(isValid), results.filter(isError));
}

async function getWorldAbbr(
  path: Path,
  worldContainer: WorldContainer
): Promise<Failable<WorldAbbr>> {
  const isDir = await path.isDirectory();
  if (isError(isDir)) return isDir;

  if (!isDir)
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
  const handler = WorldHandler.get(world.id, world.name, world.container);
  if (isError(handler)) return withError(handler);
  return await handler.save(world);
}

/**
 * ワールドデータを新規生成して返す
 * ワールドのidは呼び出すたびに新しくなる
 */
export async function newWorld(): Promise<WithError<Failable<World>>> {
  const vanillaVersions = await versionContainer.listVersions('vanilla', true);
  if (isError(vanillaVersions)) return withError(vanillaVersions);

  const latestRelease = vanillaVersions.find((ver) => ver.release);

  const systemSettings = await getSystemSettings();

  if (latestRelease === undefined)
    throw new Error('Assertion: This error cannot occur');

  // ワールドを配置するデフォルトのコンテナを指定
  const containerSetting = systemSettings.container[0];
  if (containerSetting === undefined) {
    return withError(errorMessage.core.container.noContainerSubscribed());
  }
  const container = containerSetting.container;

  const name = await getDefaultWorldName(container);

  // WorldHandlerに登録
  const id = WorldHandler.register(name, container);

  const world: World = {
    name,
    container,
    id,
    version: { type: 'vanilla', ...latestRelease },
    using: false,
    remote: undefined,
    last_date: getCurrentTimestamp(true),
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
    ngrok_setting: {
      use_ngrok: true,
    },
  };

  return withError(world);
}

/** 新規作成する際のワールド名を取得 */
async function getDefaultWorldName(container: WorldContainer) {
  let worldName = NEW_WORLD_NAME;

  let result = await validateNewWorldName(container, worldName);
  let i = 1;
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
  const handler = WorldHandler.get(world.id, world.name, world.container);
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
 * ワールドデータを複製する
 */
export async function duplicateWorld(
  worldID: WorldID,
  name?: WorldName
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return withError(handler);
  return await handler.duplicate(name);
}

/**
 * ワールドデータをバックアップする
 */
export async function backupWorld(
  worldID: WorldID
): Promise<WithError<Failable<BackupData>>> {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return withError(handler);
  return await handler.backup();
}

/**
 * ワールドデータをバックアップから復元する
 */
export async function restoreWorld(
  worldID: WorldID,
  backup: BackupData
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return withError(handler);
  return await handler.restore(backup);
}

/**
 * ワールドを起動する
 */
export async function runWorld(
  worldID: WorldID
): Promise<WithError<Failable<World>>> {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return withError(handler);

  const progressor = new WorldProgressor(worldID);

  const result = await handler.run(progressor);

  return result;
}

/**
 * コマンドを実行する
 */
export function runCommand(worldID: WorldID, command: string): void {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return;
  handler.runCommand(command);
}

/**
 * サーバーを再起動
 */
export async function reboot(worldID: WorldID): Promise<void> {
  const handler = WorldHandler.get(worldID);
  if (isError(handler)) return;
  await handler.reboot();
}

/**
 * ワールドの最新のログを取得する
 */
export async function fetchLatestWorldLog(
  worldID: WorldID
): Promise<Failable<string[]>> {
  const handler = WorldHandler.get(worldID);

  if (isError(handler)) return handler;

  const log = await new WorldLogHandler(handler.getSavePath()).loadLatest();

  if (isError(log)) {
    return errorMessage.core.world.missingLatestLog({
      name: handler.name,
      container: handler.container,
    });
  }

  return log;
}
