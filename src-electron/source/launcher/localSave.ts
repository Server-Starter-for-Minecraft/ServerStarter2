import {
  ErrorMessage,
  Failable,
  WithError,
} from 'app/src-electron/schema/error';
import { CustomMapData } from 'app/src-electron/schema/filedata';
import { Path } from 'app/src-electron/util/binary/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { withError } from 'app/src-electron/util/error/witherror';
import { asyncMap } from 'app/src-electron/util/obj/objmap';
import { getSystemSettings } from '../stores/system';
import { loadCustomMap } from '../world/customMap';
import { getLocalSaveContainers, uniquePaths } from './launcherProfile';

/**
 * Minecraft Launcherの設定から自動検出した，シングルプレイのワールドの保存先一覧を取得する
 *
 * システム設定でユーザーが追加した保存先は含まない
 * @returns 保存先ディレクトリの絶対パスの一覧
 */
export async function getDetectedLocalSaveContainers(): Promise<string[]> {
  return (await getLocalSaveContainers()).map((p) => p.str());
}

/**
 * 自動検出した保存先とシステム設定で追加された保存先にある，全てのシングルプレイのワールドを取得する
 * @returns 読み込めたワールドの一覧(読み込めなかったワールドはエラーとして返す)
 */
export async function getAllLocalSaveData(): Promise<
  WithError<Failable<CustomMapData[]>>
> {
  const settings = await getSystemSettings();
  const containers = uniquePaths([
    ...(await getLocalSaveContainers()),
    ...settings.localSave.containers.map((c) => new Path(c)),
  ]);

  const savedatas = await asyncMap(Array.from(containers), getLocalSaveData);

  const errors: ErrorMessage[] = [];
  const values: CustomMapData[] = [];

  savedatas.forEach((v) => {
    errors.push(...v.errors);
    values.push(...v.value);
  });

  return withError(values, errors);
}

/**
 * 保存先ディレクトリ直下にあるシングルプレイのワールドを読み込む
 * @param container 保存先ディレクトリ(savesフォルダ)
 * @returns 読み込めたワールドの一覧と，読み込めなかったワールドのエラー
 */
export async function getLocalSaveData(
  container: Path
): Promise<WithError<CustomMapData[]>> {
  const containers = await container.iter();
  if (isError(containers)) return withError([], [containers]);

  const result = await asyncMap(containers, loadCustomMap);
  return withError(result.filter(isValid), result.filter(isError));
}
