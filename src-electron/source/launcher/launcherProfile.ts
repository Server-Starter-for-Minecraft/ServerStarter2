import { app } from 'electron';
import { z } from 'zod';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { osPlatform } from 'app/src-electron/util/os/os';

/**
 * launcher_profiles.json の起動構成のうち，ServerStarterで使用する値のスキーマ
 *
 * ランチャーのバージョンや起動構成の種類によって含まれる項目が異なる
 * (javaArgs や created が無い起動構成もある)ため，使用する項目のみを検証する
 */
const LauncherProfile = z.object({
  /** ゲームディレクトリ(未設定の場合はランチャーのディレクトリを使用する) */
  gameDir: z.string().optional().catch(undefined),
});

/**
 * launcher_profiles.json のうち，ServerStarterで使用する値のスキーマ
 *
 * ファイル全体の version はランチャーの更新に伴って変化するため検証しない
 */
const LauncherProfiles = z.object({
  // 1つの起動構成が想定外の形式でも，他の起動構成は読み込めるようにする
  profiles: z.record(z.string(), LauncherProfile.catch({ gameDir: undefined })),
});

/**
 * Minecraft Launcherの起動構成のゲームディレクトリ一覧を取得
 * @returns セーブデータの保存先ディレクトリの一覧 (launcher_profiles.json が読み込めない場合はエラー)
 */
export async function getLocalSaveContainers() {
  return loadLocalSaveContainers(getLauncherPath());
}

/**
 * 指定したランチャーのディレクトリにある launcher_profiles.json から，
 * 各起動構成のセーブデータの保存先ディレクトリ(重複なし)を取得する
 *
 * @param launcherPath Minecraft Launcherのディレクトリ (e.g. %APPDATA%/.minecraft)
 * @returns セーブデータの保存先ディレクトリ(`<gameDir>/saves`)の一覧
 */
export async function loadLocalSaveContainers(
  launcherPath: Path
): Promise<Failable<Path[]>> {
  const jsonPath = launcherPath.child('launcher_profiles.json');
  const json = await jsonPath.readJson(LauncherProfiles);

  if (isError(json)) return json;

  const defaultLocalSaveContainer = launcherPath.child('saves');

  return [
    ...new Set(
      Object.values(json.profiles).map((v) =>
        (v.gameDir
          ? new Path(v.gameDir).child('saves')
          : defaultLocalSaveContainer
        )
          .absolute()
          .str()
      )
    ),
  ].map((x) => new Path(x));
}

function getLauncherPath(): Path {
  const homePath = new Path(app.getPath('home'));
  switch (osPlatform) {
    case 'windows-x64':
      return homePath.child('AppData/Roaming/.minecraft/');
    case 'mac-os':
    case 'mac-os-arm64':
      return homePath.child('Library/Application Support/minecraft/');
    case 'debian':
      return homePath.child('.minecraft/');
    case 'redhat':
      return homePath.child('.minecraft/');
  }
}
