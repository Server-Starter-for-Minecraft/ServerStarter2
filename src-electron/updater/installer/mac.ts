import { spawn } from 'child_process';
import { BytesData } from 'app/src-electron/util/bytesData';
import { isError } from 'app/src-electron/util/error/error';
import { app } from 'electron';
import { mainPath } from 'app/src-electron/core/const';

/** macの最新版をダウンロードしてインストールして再起動 */
export const installMac = async (pkgurl: string): Promise<void> => {
  const dest = mainPath.child('updater.pkg');
  const data = await BytesData.fromURL(pkgurl);

  if (isError(data)) return;
  await data.write(dest.str(), true);

  const bat = mainPath.child('updater.sh');
  await bat.writeText(`#!/bin/sh
echo "updating"
installer -pkg updater.pkg -target /
open -a "${app.getPath('exe')}"
exit 0
`);

  const sub = spawn('open', ['updater.sh'], {
    cwd: mainPath.str(),
    env: process.env,
    shell: true,
    detached: true,
    windowsHide: true,
  });
  sub.unref();

  app.exit();
};
