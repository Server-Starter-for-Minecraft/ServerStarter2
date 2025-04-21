import { spawn } from 'child_process';
import { app } from 'electron';
import { mainPath } from 'app/src-electron/source/const';
import { getSystemSettings } from 'app/src-electron/source/stores/system';
import { isError } from 'app/src-electron/util/error/error';
import { getBytesFile } from 'app/src-electron/util/github/rest';
import { updateMessage } from './message';

/** 
 * windowsの最新版をダウンロードしてインストールして再起動
 * 
 * アップデートに失敗してもエラーで処理を止める必要がないため握りつぶす
 */
export const installWindows = async (
  msiurl: string,
  pat: string | undefined
): Promise<void> => {
  const dest = mainPath.child('updater.msi');

  const data = await getBytesFile(msiurl, pat);
  if (isError(data)) return;

  const writeUpdater = await data.write(dest.path, true);
  if (isError(writeUpdater)) return;

  const sys = await getSystemSettings();

  const bat = mainPath.child('updater.bat');
  const writeBat = await bat.writeText(`@echo off
echo ${updateMessage[sys.user.language].main}
msiexec /i updater.msi /qb
start "" "${app.getPath('exe')}"
exit`);
    if (isError(writeBat)) return;

  const sub = spawn('start', ['/min', '""', 'updater.bat'], {
    cwd: mainPath.path,
    env: process.env,
    shell: true,
    detached: true,
    windowsHide: true,
  });
  sub.unref();

  app.exit();
};
