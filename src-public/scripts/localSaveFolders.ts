import type { SystemLocalSaveSetting } from 'app/src-electron/schema/system';

/** シングルプレイのワールドの読み込み先フォルダ(savesフォルダ)の表示用データ */
export type LocalSaveFolder = {
  /** フォルダのパス */
  path: string;
  /** 「既存のワールドを導入」の一覧にこのフォルダのワールドを表示するか */
  visible: boolean;
  /** Minecraft Launcherの設定から自動検出したフォルダか */
  detected: boolean;
};

/**
 * 自動検出したフォルダとシステム設定から，読み込み先フォルダの一覧を作成する
 *
 * 登録を解除した自動検出フォルダは含めない
 *
 * パスは文字列として比較するため，大文字・小文字だけが異なる同じフォルダは別のフォルダとして扱う
 * (読み込み時の重複はバックエンドで取り除くため，表示が重複するだけで実害は小さい)
 *
 * @param detected Minecraft Launcherの設定から自動検出したフォルダのパス
 * @param setting シングルプレイのワールドに関するシステム設定
 * @returns 自動検出したフォルダ，ユーザーが追加したフォルダの順に並べた一覧(重複なし)
 */
export function listLocalSaveFolders(
  detected: string[],
  setting: SystemLocalSaveSetting
): LocalSaveFolder[] {
  const isVisible = (path: string) =>
    setting.containers.find((c) => c.path === path)?.visible ?? true;

  const detectedFolders = detected
    .filter((path) => !setting.excluded.includes(path))
    .map((path) => ({ path, visible: isVisible(path), detected: true }));

  const addedFolders = setting.containers
    .filter((c) => !detected.includes(c.path))
    .map((c) => ({ path: c.path, visible: c.visible, detected: false }));

  return [...detectedFolders, ...addedFolders];
}

/**
 * 読み込み先フォルダを追加する(登録を解除した自動検出フォルダを再び追加する場合も含む)
 * @param setting 変更するシステム設定
 * @param path 追加するフォルダのパス
 */
export function registerLocalSaveFolder(
  setting: SystemLocalSaveSetting,
  path: string
) {
  setting.excluded = setting.excluded.filter((p) => p !== path);
  const container = setting.containers.find((c) => c.path === path);
  if (container) container.visible = true;
  else setting.containers.push({ path, visible: true });
}

/**
 * 読み込み先フォルダの表示・非表示を切り替える
 *
 * 自動検出したフォルダは非表示の間だけ設定に記録し，再表示したときは記録を消す
 * (後で自動検出されなくなった場合に，ユーザーが追加したフォルダとして残らないようにするため)
 *
 * @param setting 変更するシステム設定
 * @param folder 対象のフォルダ
 * @param visible 表示する場合は true
 */
export function setLocalSaveFolderVisible(
  setting: SystemLocalSaveSetting,
  folder: Pick<LocalSaveFolder, 'path' | 'detected'>,
  visible: boolean
) {
  if (folder.detected && visible) {
    setting.containers = setting.containers.filter(
      (c) => c.path !== folder.path
    );
    return;
  }
  const container = setting.containers.find((c) => c.path === folder.path);
  if (container) container.visible = visible;
  else setting.containers.push({ path: folder.path, visible });
}

/**
 * 読み込み先フォルダの表示名を返す
 *
 * savesフォルダの場合はそれを含むゲームディレクトリの名前，それ以外はフォルダ自身の名前とする
 *
 * @param path フォルダのパス (e.g. C:/Users/xxx/AppData/Roaming/.minecraft/saves)
 * @returns 表示名 (e.g. .minecraft)
 */
export function localSaveFolderTitle(path: string) {
  const names = path.split(/[\\/]/).filter((n) => n !== '');
  const last = names.at(-1) ?? path;
  return last.toLowerCase() === 'saves' ? (names.at(-2) ?? last) : last;
}

/**
 * 読み込み先フォルダの登録を解除する(フォルダ自体は削除しない)
 *
 * 自動検出したフォルダは，再び自動検出されても表示しないよう記録する
 *
 * @param setting 変更するシステム設定
 * @param folder 登録を解除するフォルダ
 */
export function unregisterLocalSaveFolder(
  setting: SystemLocalSaveSetting,
  folder: Pick<LocalSaveFolder, 'path' | 'detected'>
) {
  setting.containers = setting.containers.filter((c) => c.path !== folder.path);
  if (folder.detected && !setting.excluded.includes(folder.path)) {
    setting.excluded.push(folder.path);
  }
}
