import { app } from 'electron';
import { mainPath } from 'app/src-electron/source/const';
import { getSystemSettings } from 'app/src-electron/source/stores/system';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { isError } from 'app/src-electron/util/error/error';
import { getBytesFile } from 'app/src-electron/util/github/rest';
import { launchDetached } from './launch';
import { updateMessage } from './message';

/**
 * macの最新版をダウンロードしてインストールして再起動
 *
 * @returns インストーラーを起動してアプリを終了した場合はtrue、ダウンロード等に失敗した場合はfalse
 */
export const installMac = async (
  pkgurl: string,
  pat: string | undefined
): Promise<boolean> => {
  const dest = mainPath.child('updater.pkg');
  const data = await getBytesFile(pkgurl, pat);

  if (isError(data)) return false;
  const written = await data.write(dest.str(), true);
  if (isError(written)) return false;

  const sys = await getSystemSettings();

  const sh = mainPath.child('updater.sh');
  const script = await BytesData.fromText(`#!/bin/sh
echo "${updateMessage[sys.user.language].main}"
echo "${updateMessage[sys.user.language].mac_pass}"
sudo installer -pkg ${dest.absolute().strQuoted()} -target /
open -a "${app.getPath('exe')}"
exit 0
`);
  if (isError(script)) return false;
  const writtenScript = await script.write(sh.str(), true);
  if (isError(writtenScript)) return false;

  // インストーラーを起動できなかった場合は、アプリを終了せずに失敗を返す
  const launched = await launchDetached(
    'open',
    ['-a', 'Terminal', 'updater.sh'],
    mainPath.str()
  );
  if (!launched) return false;

  app.exit();
  return true;
};
