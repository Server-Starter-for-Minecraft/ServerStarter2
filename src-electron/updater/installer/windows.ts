import { app } from 'electron';
import { rootLogger } from 'app/src-electron/common/logger';
import { ErrorMessage } from 'app/src-electron/schema/error';
import { mainPath } from 'app/src-electron/source/const';
import { getSystemSettings } from 'app/src-electron/source/stores/system';
import { launchDetachedInShell } from 'app/src-electron/util/binary/detachedProcess';
import { isError } from 'app/src-electron/util/error/error';
import { getBytesFile } from 'app/src-electron/util/github/rest';
import { updateMessage } from './message';

/**
 * インストールの失敗をログに残して false を返す
 *
 * アップデートは起動時に API を介さずに行うため，失敗の原因はここでログに残す
 *
 * @param error 失敗の原因
 * @returns 常に false（インストールに失敗したことを表す）
 */
function failed(error: ErrorMessage): false {
  rootLogger.updater.install().error(error);
  return false;
}

/**
 * windowsの最新版をダウンロードしてインストールして再起動
 *
 * アップデートに失敗してもエラーで処理を止める必要がないため握りつぶす
 *
 * @returns インストーラーを起動してアプリを終了した場合はtrue、ダウンロード等に失敗した場合はfalse
 */
export const installWindows = async (
  msiurl: string,
  pat: string | undefined
): Promise<boolean> => {
  const dest = mainPath.child('updater.msi');

  const data = await getBytesFile(msiurl, pat);
  if (isError(data)) return failed(data);

  const writeUpdater = await data.write(dest.path, true);
  if (isError(writeUpdater)) return failed(writeUpdater);

  const sys = await getSystemSettings();

  const bat = mainPath.child('updater.bat');
  const writeBat = await bat.writeText(`@echo off
echo ${updateMessage[sys.user.language].main}
msiexec /i updater.msi /qb
start "" "${app.getPath('exe')}"
exit`);
  if (isError(writeBat)) return failed(writeBat);

  // インストーラーを起動できなかった場合は、アプリを終了せずに失敗を返す
  const launched = await launchDetachedInShell(
    'start /min "" updater.bat',
    mainPath.path
  );
  if (!launched) return false;

  app.exit();
  return true;
};
