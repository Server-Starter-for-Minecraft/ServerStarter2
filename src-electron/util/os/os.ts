import { execSync } from 'child_process';
import { OsPlatform } from '../../schema/os';
import { electron } from '../electron/runtime';
import { isError, isValid } from '../error/error';
import { safeExec } from '../error/failable';
import { ignoreError } from '../error/ignore';

function getOsPlatform(): OsPlatform {
  const platform = process.platform;
  switch (platform) {
    // mac
    case 'darwin':
      if (process.arch === 'arm64') return 'mac-os-arm64';
      else return 'mac-os';

    // windows (x64の場合もwin32になる)
    case 'win32':
      // electronのソフトが動いている時点でx64確定
      return 'windows-x64';

    //linux
    case 'linux':
      const linuxType = getLinuxType();
      switch (linuxType) {
        case 'debian':
          return 'debian';
        case 'redhat':
          return 'redhat';
        default:
          throw new Error('unknown linux distribution');
      }
    default:
      throw new Error(`${platform} is unavailable os platform`);
  }
}

/** /etc/os-release の指定した項目の行を取得する */
function readOsRelease(key: 'ID_LIKE' | 'ID') {
  return safeExec(() =>
    execSync(`cat /etc/os-release | grep "^${key}="`, { encoding: 'utf-8' })
  );
}

function getLinuxType(): 'debian' | 'redhat' | undefined {
  // ID_LIKEをとってくる
  const idLike = readOsRelease('ID_LIKE');
  if (isValid(idLike)) {
    if (idLike.includes('debian')) return 'debian';
    if (idLike.includes('rhel')) return 'redhat';
  } else {
    ignoreError(
      idLike,
      'ID_LIKE が無い環境では，ID でディストリビューションを判定する'
    );
  }

  // ID_LIKEがとれなかったらIDをとってくる
  // OSごとに取ってるので追加する可能性あり
  const outstr = readOsRelease('ID');
  if (isError(outstr)) {
    ignoreError(
      outstr,
      'ID も取得できない環境は，未対応のディストリビューションとして扱う'
    );
    return undefined;
  }
  const idMatch = outstr.match(/(?:^|\n)ID\s*=(.*)\s*/);
  if (idMatch === null) return undefined;
  const id = idMatch[1];

  switch (id) {
    case 'rhel': // Red Hat Enterprise Linux
    case 'centos': // CentOS/CentOS Stream
    case 'ol': // Oracle Linux
    case 'amzn': // Amazon Linux
    case 'almalinux': // Almalinux
    case 'fedora': // fedora
      return 'redhat';
    case 'ubuntu': // Ubuntu
      return 'debian';
    default:
      return undefined;
  }
}

export const osPlatform = getOsPlatform();

/**
 * Apple SiliconのMac上で、Intel版のServerStarter2をRosetta経由で実行しているかを判定する
 *
 * Rosetta経由の場合は `osPlatform` が `mac-os`（Intel版）となるため、実機のアーキテクチャを知る必要がある処理で利用する
 *
 * @returns Rosetta経由で実行している場合はtrue（Electron外で実行している場合はfalse）
 */
export function isRunningUnderRosetta(): boolean {
  return (
    process.platform === 'darwin' &&
    (electron?.app.runningUnderARM64Translation ?? false)
  );
}
