import { Server } from '../../schema/server';
import { World } from '../../schema/world';
import { RuntimeContainer } from '../../source/runtime/runtime';
import { VersionContainer } from '../../source/version/version';
import { WorldSource } from '../../source/world/world';
import { err, ok, Result } from '../../util/base';
import { Path } from '../../util/binary/path';
import { defaultRuntimeSettings } from '../const';
import { datapackContainer } from '../setup';
import { getJvmArgs } from './runtime';

/**
 * ワールドにデータパックを展開
 */
async function extractDatapacks(
  path: Path,
  world: World
): Promise<Result<void>> {
  const dir = path.child('world/datapacks');
  const promisses = await Promise.all(
    world.datapack.map((x) => datapackContainer.extractTo(x, dir.child(x.name)))
  );
  if (promisses.some((x) => x.isErr())) {
    // 失敗したのでディレクトリを削除
    await path.remove();
    return err(new Error('DATAPACK_INSTALL_FAILED'));
  }
  return ok(undefined);
}

/**
 * ワールドをパスに展開し、各種データを導入
 */
export async function setupWorld(
  path: Path,
  world: World
): Promise<Result<Server>> {
  /** ディレクトリを削除して引数をそのまま返す */
  const cleanupAndReturn = async <T>(arg: T) => {
    await path.remove();
    return arg;
  };

  // ワールドを展開
  const worldResult = await WorldSource.extractWorldDataTo(path, world);
  if (worldResult.isErr()) return cleanupAndReturn(worldResult);

  // データパックを展開
  const datapackResult = await extractDatapacks(path, world);
  if (datapackResult.isErr()) return cleanupAndReturn(datapackResult);

  // TODO: プラグインを展開
  // TODO: modを展開

  // バーションを導入
  const versionResult = await VersionContainer.extractTo(path);
  if (versionResult.isErr()) return cleanupAndReturn(versionResult);
  const { runtime, getCommand } = versionResult.value;

  // ランタイムを導入
  const runtimeResult = await RuntimeContainer.install(runtime);
  if (runtimeResult.isErr()) return cleanupAndReturn(runtimeResult);

  // コマンドライン引数を解析
  const jvmArgs = getJvmArgs(world.runtime ?? defaultRuntimeSettings);
  if (jvmArgs.isErr()) return cleanupAndReturn(jvmArgs);

  // 実行時コマンドを取得
  const command = getCommand({
    runtimePath: runtimeResult.value,
    jvmArgs: jvmArgs.value,
  });

  // ワールドの展開に成功
  return ok({ command });
}

/**
 * ワールドをパスから撤収
 */
export async function teardownWorld(
  path: Path,
  world: World
): Promise<Result<void>> {
  // ワールドを撤収
  return await WorldSource.packWorldDataFrom(path, world);
}
