import { isError } from 'app/src-electron/util/error/error';
import { osPlatform } from 'app/src-electron/util/os';
import { Path } from 'app/src-electron/util/path';
import { app } from 'electron';

type LauncherProfile = {
  created: string;
  gameDir?: string;
  icon: string;
  javaArgs: string;
  lastUsed: string;
  lastVersionId: string;
  name: string;
  type: string;
};

type LauncherProfiles = {
  profiles: Record<string, LauncherProfile>;
  version: 3;
};

/** Minecraft Launcherの起動構成のゲームディレクトリ一覧を取得 */
// TODO: LauncherProfilesのversionが3以外だったらエラー
export async function getLocalSaveContainers() {
  const launcherPath = getLauncherPath();
  const jsonPath = getLauncherPath().child('launcher_profiles.json');
  const json = await jsonPath.readJson<LauncherProfiles>();

  if (isError(json)) return json;

  const defaultLocalSaveContainer = launcherPath.child('saves');

  return new Set(
    Object.values(json.profiles).map((v) =>
      v.gameDir ? new Path(v.gameDir).child('saves') : defaultLocalSaveContainer
    )
  );
}

function getLauncherPath(): Path {
  const homePath = new Path(app.getPath('home'));
  switch (osPlatform) {
    case 'windows-x64':
      return homePath.child('AppData/Roaming/.minecraft/');
    case 'mac-os':
    case 'mac-os-arm64':
      return homePath.child('Library/Application Support/minecraft/saves');
    case 'linux':
      return homePath.child('.minecraft/saves');
  }
}
