import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';

/** テストで使う設定ファイルの置き場所 */
const workPath = new Path(__dirname).child('work', 'system');

// 設定ファイルの暗号化（Electron の safeStorage）は，テストの環境では使えないため差し替える
// （復号は常に失敗させ，設定ファイルが壊れている状況を再現する）
vi.mock('electron', () => ({
  // Electron の外で実行していることを表す（保存先などはテスト用のものを使う）
  app: undefined,
  safeStorage: {
    encryptString: (text: string) => Buffer.from(text),
    decryptString: () => {
      throw new Error('broken settings');
    },
  },
}));
// 設定ファイルの保存先をテストの作業フォルダに置き換える
vi.mock('../const', async (importOriginal) => {
  const { Path } = await import('app/src-electron/util/binary/path');
  return {
    ...(await importOriginal<typeof import('../const')>()),
    settingPath: new Path(__dirname).child(
      'work',
      'system',
      'settings.ssconfig'
    ),
  };
});
// フロントエンドへの通知（IPC）を差し替える
vi.mock('app/src-electron/core/api', () => ({
  api: { send: { Error: vi.fn() } },
}));

beforeEach(async () => {
  await workPath.emptyDir();
  // 設定は一度読み込むと保持されるため，テストごとに読み込み直す
  vi.resetModules();
});

describe('システム設定の読み込み', () => {
  test('設定ファイルを読み込めない場合は，ファイルをバックアップして既定値で起動し，画面の準備後に通知する', async () => {
    const settingPath = workPath.child('settings.ssconfig');
    await settingPath.writeText('broken content');

    const { getSystemSettings } = await import('./system');
    const { DEFAULT_SYSTEM_SETTINGS } =
      await import('app/src-electron/schema/system');
    const { readyWindow } =
      await import('app/src-electron/lifecycle/lifecycle');
    const { api } = await import('app/src-electron/core/api');

    const settings = await getSystemSettings();
    expect(settings).toEqual(DEFAULT_SYSTEM_SETTINGS);

    // 読み込めなかった内容がバックアップとして残る
    const files = await workPath.iter();
    expect(files).not.toHaveProperty('type', 'error');
    const backups = Array.isArray(files)
      ? files.filter((f) =>
          f.basename().startsWith('settings.ssconfig.broken-')
        )
      : [];
    expect(backups).toHaveLength(1);
    expect(await backups[0].readText()).toBe('broken content');

    // 画面の準備ができた時点でユーザーへ通知する
    await readyWindow();
    expect(api.send.Error).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'core.brokenSystemSettings' })
    );
  });

  test('既定値で起動しても，共有の既定値は書き換えられない', async () => {
    await workPath.child('settings.ssconfig').writeText('broken content');
    const { getSystemSettings } = await import('./system');
    const { DEFAULT_SYSTEM_SETTINGS } =
      await import('app/src-electron/schema/system');
    const before = structuredClone(DEFAULT_SYSTEM_SETTINGS);

    const settings = await getSystemSettings();
    settings.user.language = settings.user.language === 'ja' ? 'en-US' : 'ja';

    expect(DEFAULT_SYSTEM_SETTINGS).toEqual(before);
  });
});
