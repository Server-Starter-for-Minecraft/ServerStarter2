import type { DialogChainObject } from 'quasar';
import { describe, expect, test } from 'vitest';
import { waitDialogClosed } from './dialog';

/**
 * QuasarのDialogChainObjectの公開仕様（OK時はonOk，それ以外で閉じられた時はonCancelが呼ばれる）を再現した疑似ダイアログ
 */
function createFakeDialog() {
  const okFns: ((payload?: unknown) => void)[] = [];
  const cancelFns: (() => void)[] = [];
  const dialog = {
    onOk(fn: (payload?: unknown) => void) {
      okFns.push(fn);
      return dialog;
    },
    onCancel(fn: () => void) {
      cancelFns.push(fn);
      return dialog;
    },
    onDismiss(fn: () => void) {
      okFns.push(fn);
      cancelFns.push(fn);
      return dialog;
    },
  };
  return {
    dialog: dialog as unknown as DialogChainObject,
    ok: (payload?: unknown) => okFns.forEach((fn) => fn(payload)),
    cancel: () => cancelFns.forEach((fn) => fn()),
  };
}

describe('waitDialogClosed', () => {
  test('OKで閉じられた場合はダイアログの戻り値を返す', async () => {
    const fake = createFakeDialog();
    const result = waitDialogClosed(fake.dialog);
    fake.ok({ value: 1 });
    await expect(result).resolves.toEqual({ ok: true, payload: { value: 1 } });
  });

  test('キャンセル（スキップ）で閉じられた場合も完了する', async () => {
    const fake = createFakeDialog();
    const result = waitDialogClosed(fake.dialog);
    fake.cancel();
    await expect(result).resolves.toEqual({ ok: false });
  });
});
