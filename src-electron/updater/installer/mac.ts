import { spawn } from 'child_process';
import { app } from 'electron';
import { mainPath } from 'app/src-electron/core/const';
import { getSystemSettings } from 'app/src-electron/core/stores/system';
import { BytesData } from 'app/src-electron/util/bytesData';
import { isError } from 'app/src-electron/util/error/error';
import { getBytesFile } from 'app/src-electron/util/github/rest';
import { updateMessage } from './message';

/** macの最新版をダウンロードしてインストールして再起動 */
export const installMac = async (
  pkgurl: string,
  pat: string | undefined
): Promise<void> => {
  const dest = mainPath.child('updater.pkg');
  const data = await getBytesFile(pkgurl, pat);

  if (isError(data)) return;
  await data.write(dest.str(), true);

  const sys = await getSystemSettings();

  const sh = mainPath.child('updater.sh');
  const script = await BytesData.fromText(`#!/bin/sh
echo "${updateMessage[sys.user.language].main}"
echo "${updateMessage[sys.user.language].mac_pass}"
sudo installer -pkg ${dest.absolute().strQuoted()} -target /
open -a "${app.getPath('exe')}"
exit 0
`);
  if (isError(script)) return;
  await script.write(sh.str(), true);

  const sub = spawn('open', ['-a', 'Terminal', 'updater.sh'], {
    cwd: mainPath.str(),
    env: process.env,
    shell: true,
    detached: true,
    windowsHide: true,
  });
  sub.unref();

  app.exit();
};
