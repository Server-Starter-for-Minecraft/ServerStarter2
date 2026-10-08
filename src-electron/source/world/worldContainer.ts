import { isAbsolute } from 'path';
import { WorldContainer } from 'src-electron/schema/brands';
import { WorldContainerSetting } from 'src-electron/schema/system';
import { Path } from 'app/src-electron/util/binary/path';
import { mainPath } from '../../source/const';

// world.containerが相対パスの場合mainpathからの相対パスとして処理
export function worldContainerToPath(worldContainer: WorldContainer): Path {
  return isAbsolute(worldContainer)
    ? new Path(worldContainer)
    : mainPath.child(worldContainer);
}

/**
 * 新規ワールドを配置するコンテナ設定を選択する
 *
 * 非表示のコンテナに作成すると画面上に表示されないため、表示中のコンテナを優先する。
 * 表示中のコンテナが無い場合は先頭のコンテナを返す。
 *
 * @param containers システム設定に登録されたコンテナ一覧(登録順)
 * @returns 配置先のコンテナ設定(コンテナが1つも登録されていない場合はundefined)
 */
export function selectNewWorldContainer(
  containers: WorldContainerSetting[]
): WorldContainerSetting | undefined {
  return containers.find((c) => c.visible) ?? containers[0];
}
