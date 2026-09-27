import type { DialogChainObject } from 'quasar';

/**
 * ダイアログが閉じられた結果
 *
 * - `ok: true` : OKで閉じられた（`payload`はダイアログの戻り値）
 * - `ok: false` : キャンセル（スキップ・外側クリック等）で閉じられた
 */
export type DialogResult<T> = { ok: true; payload: T } | { ok: false };

/**
 * Quasarのダイアログが閉じられるまで待機する
 *
 * `onOk`だけを購読するとキャンセル時に後続処理が実行されないため，
 * OK・キャンセルのどちらで閉じられた場合も必ず完了するPromiseに変換する
 *
 * @param dialog `$q.dialog()`の戻り値
 * @returns ダイアログが閉じられた結果
 */
export function waitDialogClosed<T = unknown>(
  dialog: DialogChainObject
): Promise<DialogResult<T>> {
  return new Promise((resolve) => {
    dialog
      .onOk((payload: T) => resolve({ ok: true, payload }))
      .onCancel(() => resolve({ ok: false }));
  });
}
