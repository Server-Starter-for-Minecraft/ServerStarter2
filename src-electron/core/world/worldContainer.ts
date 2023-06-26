import { isAbsolute } from 'path';
import { Path } from 'src-electron/util/path';
import { mainPath } from '../const';
import { WorldContainer } from 'src-electron/schema/brands';
import { WorldContainers } from 'app/src-electron/schema/system';
import { asyncForEach, asyncMap, objMap } from 'app/src-electron/util/objmap';

// world.containerが相対パスの場合mainpathからの相対パスとして処理
export function worldContainerToPath(worldContainer: WorldContainer): Path {
  return isAbsolute(worldContainer)
    ? new Path(worldContainer)
    : mainPath.child(worldContainer);
}

/** worldContainersの中身の変更に応じて、セーブデータを移動する */
export async function updateWorldContainers(
  current: WorldContainers,
  next: WorldContainers
) {
  next.default = await moveWorldContainer(current.default, next.default);

  await asyncForEach(
    Object.entries(next.custom),
    async ([name, nextContainer]) => {
      const currentContainer = current.custom[name];
      await worldContainerToPath(nextContainer).mkdir(true);
      if (currentContainer !== undefined) {
        await moveWorldContainer(currentContainer, nextContainer);
      }
    }
  );

  return next;
}

/** WorldContainerの指すパスが変更されていた場合ディレクトリの中身を移動する */
async function moveWorldContainer(
  current: WorldContainer,
  next: WorldContainer
) {
  const currentPath = worldContainerToPath(current);
  const nextPath = worldContainerToPath(next);
  if (currentPath.path === nextPath.path) return next;

  // 現在のコンテナの中身を全部移動
  await asyncForEach(await currentPath.iter(), async (currentChild) => {
    const targetChild = nextPath.child(currentChild.basename());
    console.log(currentChild, targetChild);
    // 移動先のファイル/ディレクトリが既に存在している場合削除して上書き
    if (targetChild.exists()) await targetChild.remove(true);
    await currentChild.moveTo(targetChild);
  });
  return next;
}
