import { LocalSaveContainer } from 'app/src-electron/schema/system';
import { osPlatform } from 'app/src-electron/util/os';
import { app } from 'electron';
import * as path from 'path';

/** Minecraftクライアントのデフォルトのセーブディレクトリを得る */
export function getDefaultLocalSavePath(): LocalSaveContainer {
  const homePath = app.getPath('home');
  switch (osPlatform) {
    case 'windows-x64':
      return path.join(
        homePath,
        'AppData/Roaming/.minecraft/saves'
      ) as LocalSaveContainer;
    case 'mac-os':
    case 'mac-os-arm64':
      return path.join(
        homePath,
        'Library/Application Support.minecraft/saves'
      ) as LocalSaveContainer;
    case 'linux':
      return path.join(homePath, '.minecraft/saves') as LocalSaveContainer;
  }
}
