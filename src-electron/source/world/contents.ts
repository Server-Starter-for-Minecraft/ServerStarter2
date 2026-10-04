import { WithError } from 'app/src-electron/schema/error';
import { WorldAdditional, WorldID } from 'app/src-electron/schema/world';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { withError } from 'app/src-electron/util/error/witherror';
import { serverAllAdditionalFiles } from '../additionalContents/all';
import { WorldHandler } from './handler';

/**
 * ワールドの保存先にある追加コンテンツ（データパック・プラグイン・MOD）の一覧を読み込む
 *
 * ServerStarter2を介さずに保存先へ直接追加・削除された追加コンテンツを画面に反映するために利用する。
 * ワールド全体の読み込み（GetWorld）と異なり、リモートとの同期や設定ファイルの読み込みは行わない。
 *
 * @param world 対象のワールド
 * @returns 保存先にある追加コンテンツの一覧
 */
export async function getWorldContents(
  world: WorldID
): Promise<WithError<Failable<WorldAdditional>>> {
  const handler = WorldHandler.get(world);
  if (isError(handler)) return withError(handler);
  return await serverAllAdditionalFiles.load(handler.getSavePath(), world);
}
