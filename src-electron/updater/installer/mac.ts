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

  const sh = mainPath.child('updater.sh');
  const script = await BytesData.fromText(`#!/bin/sh
echo "updating ServerStarter2..."
sudo installer -pkg ${dest.absolute().strQuoted()} -target /
open -a "${app.getPath('exe')}"
exit 0
`);
  if (isError(script)) return
  await script.write(sh.str(),true)

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
