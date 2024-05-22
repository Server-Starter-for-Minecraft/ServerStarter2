import { DatapackContainer } from '../../source/datapack/datapack';
import { RuntimeContainer } from '../../source/runtime/runtime';
import { ServerMeta } from '../../source/server/server';
import { VersionContainer } from '../../source/version/version';
import { World, WorldMeta } from '../../source/world/world';
import { Result, err, ok } from '../../util/base';
import { Path } from '../../util/binary/path';
import { getJvmArgs } from './runtime';

async function extractDatapacks(
  path: Path,
  meta: WorldMeta
): Promise<Result<void>> {
  const dir = path.child('world/datapacks');
  const promisses = await Promise.all(
    meta.datapack.map((x) => DatapackContainer.extractTo(x, dir.child(x.name)))
  );
  if (promisses.some((x) => x.isErr())) {
    // 失敗したのでディレクトリを削除
    await path.remove();
    return err(new Error('DATAPACK_INSTALL_FAILED'));
  }
  return ok(undefined);
}

export async function setupWorld(
  path: Path,
  world: World,
  meta: WorldMeta
): Promise<Result<ServerMeta>> {
  /** ディレクトリを削除して引数をそのまま返す */
  const cleanupAndReturn = async <T>(arg: T) => {
    await path.remove();
    return arg;
  };

  // ワールドを展開
  const worldResult = await world.extractTo(path);
  if (worldResult.isErr()) return cleanupAndReturn(worldResult);

  // データパックを展開
  const datapackResult = await extractDatapacks(path, meta);
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

  // 実行時コマンドを取得
  const command = getCommand({
    runtimePath: runtimeResult.value,
    jvmArgs: getJvmArgs(meta.runtime),
  });

  // ワールドの展開に成功
  return ok({ command });
}
