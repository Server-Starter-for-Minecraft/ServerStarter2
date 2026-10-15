import { app } from 'electron';
import { z } from 'zod';
import { Path } from 'app/src-electron/util/binary/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { Failable, safeExec } from 'app/src-electron/util/error/failable';
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
 * 起動構成を記録したファイル名の一覧
 *
 * Microsoft Store版(Xboxアプリ)のランチャーは別名のファイルに記録するため，両方を読み込む
 */
const LAUNCHER_PROFILES_FILES = [
  'launcher_profiles.json',
  'launcher_profiles_microsoft_store.json',
];

/**
 * Minecraft Launcherの設定から，シングルプレイのワールドの保存先ディレクトリ一覧を自動検出する
 * @returns セーブデータの保存先ディレクトリの一覧(ランチャーのディレクトリを特定できない場合はエラー)
 */
export async function getLocalSaveContainers(): Promise<Failable<Path[]>> {
  const launcherPath = getLauncherPath();
  if (isError(launcherPath)) return launcherPath;
  return loadLocalSaveContainers(launcherPath);
}

/**
 * 指定したランチャーのディレクトリにある起動構成のファイルから，
 * 各起動構成のセーブデータの保存先ディレクトリ(重複なし)を取得する
 *
 * 既定の保存先(`<launcherPath>/saves`)は，起動構成のファイルが無い・読み込めない場合も含めて常に結果に含める
 *
 * @param launcherPath Minecraft Launcherのディレクトリ (e.g. %APPDATA%/.minecraft)
 * @returns セーブデータの保存先ディレクトリ(`<gameDir>/saves`)の一覧
 */
export async function loadLocalSaveContainers(
  launcherPath: Path
): Promise<Path[]> {
  const defaultLocalSaveContainer = launcherPath.child('saves');

  const profilesList = await Promise.all(
    LAUNCHER_PROFILES_FILES.map((name) =>
      launcherPath.child(name).readJson(LauncherProfiles)
    )
  );

  // 読み込めなかったファイルは無視する(ランチャーの種類によって存在しないファイルがあるため)
  const gameDirContainers = profilesList
    .filter(isValid)
    .flatMap((json) => Object.values(json.profiles))
    .map((v) =>
      v.gameDir ? new Path(v.gameDir).child('saves') : defaultLocalSaveContainer
    );

  return uniquePaths([defaultLocalSaveContainer, ...gameDirContainers]);
}

/**
 * パスの一覧から，同じ場所を指すパスの重複を取り除く
 * @param paths パスの一覧
 * @returns 重複を除いた絶対パスの一覧(最初に現れた順)
 */
export function uniquePaths(paths: Path[]): Path[] {
  // Windowsではパスの大文字・小文字を区別しないため，比較時のみ小文字にそろえる
  const toKey = (str: string) =>
    osPlatform === 'windows-x64' ? str.toLowerCase() : str;

  const unique = new Map<string, Path>();
  paths.forEach((p) => {
    const absolute = p.absolute();
    const key = toKey(absolute.str());
    if (!unique.has(key)) unique.set(key, absolute);
  });
  return [...unique.values()];
}

/**
 * OSごとのMinecraft Launcherのディレクトリを返す
 * @returns ランチャーのディレクトリ(ホームディレクトリを取得できない場合はエラー)
 */
function getLauncherPath(): Failable<Path> {
  // app.getPath はホームディレクトリを取得できない場合に例外を投げるため，エラーに変換する
  const home = safeExec(() => app.getPath('home'));
  if (isError(home)) return home;

  const homePath = new Path(home);
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
