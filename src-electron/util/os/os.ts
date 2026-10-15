import { execSync } from 'child_process';
import { app } from 'electron';
import { OsPlatform } from '../../schema/os';

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

function getLinuxType() {
  // ID_LIKEをとってくる
  try {
    const idLikeCommand = 'cat /etc/os-release | grep "^ID_LIKE="';
    const outstr = execSync(idLikeCommand, { encoding: 'utf-8' });
    // Parse the output to determine the Linux type
    if (outstr.includes('debian')) {
      return 'debian';
    } else if (outstr.includes('rhel')) {
      return 'redhat';
    } else {
      throw new Error('unknown linux distribution');
    }
  } catch {
    // ID_LIKEがとれなかったらIDをとってくる
    // OSごとに取ってるので追加する可能性あり

    // Execute the command to check the distribution
    const command = 'cat /etc/os-release | grep "^ID="';

    try {
      const outstr = execSync(command, { encoding: 'utf-8' });
      const idMatch = outstr.match(/(?:^|\n)ID\s*=(.*)\s*/);
      if (idMatch === null) return idMatch;
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
    } catch {
      return undefined;
    }
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
    (app?.runningUnderARM64Translation ?? false)
  );
}
