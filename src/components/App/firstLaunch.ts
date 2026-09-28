import type { SystemUserSetting } from 'app/src-electron/schema/system';
import type { ReturnOwnerDialog } from '../SystemSettings/General/OwnerSetter/iOwnerDialog';
import type { DialogResult } from '../util/dialog';

/** 初回起動時に表示するダイアログ群 */
export interface FirstLaunchDialogs {
  /** 利用規約への同意を求めるダイアログ */
  showWelcome: () => Promise<DialogResult<unknown>>;
  /** オーナープレイヤーの登録を求めるダイアログ（スキップ可能） */
  showOwnerRegister: () => Promise<DialogResult<ReturnOwnerDialog>>;
}

/**
 * 初回起動時の利用規約への同意とオーナープレイヤーの登録を行う
 *
 * オーナーの登録がスキップされた場合もこの処理は完了し，
 * 呼び出し元はそのまま起動処理を続行できる
 *
 * @param userSettings 同意状況とオーナーを書き込むユーザー設定
 * @param dialogs 表示するダイアログ
 */
export async function runFirstLaunch(
  userSettings: Pick<SystemUserSetting, 'eula' | 'owner'>,
  dialogs: FirstLaunchDialogs
): Promise<void> {
  const welcome = await dialogs.showWelcome();
  if (welcome.ok) {
    userSettings.eula = true;
  }

  const owner = await dialogs.showOwnerRegister();
  if (owner.ok && owner.payload.ownerPlayer !== undefined) {
    userSettings.owner = owner.payload.ownerPlayer.uuid;
  }
}
