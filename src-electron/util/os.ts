export type OsPlatform = 'linux' | 'mac-os' | 'mac-os-arm64' | 'windows-x64';

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
      return 'linux';
    default:
      throw new Error(`${platform} is unavailable os platform`);
  }
}

export const osPlatform = getOsPlatform();
