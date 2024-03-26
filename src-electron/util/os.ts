export type OsPlatform =
  | 'debian'
  | 'redhat'
  | 'mac-os'
  | 'mac-os-arm64'
  | 'windows-x64';

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

import { execSync } from 'child_process';

function getLinuxType() {
  // Execute the command to check the distribution
  const command = 'cat /etc/os-release | grep "ID_LIKE"';

  const outstr = execSync(command, { encoding: 'utf-8' });

  // Parse the output to determine the Linux type
  if (outstr.includes('debian')) {
    return 'debian';
  } else if (outstr.includes('rhel')) {
    return 'redhat';
  } else {
    return undefined;
  }
}

export const osPlatform = getOsPlatform();
