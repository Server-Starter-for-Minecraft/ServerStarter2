import fs from 'fs-extra';
import { utimes } from 'node:fs/promises';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';

/** テストで使う設定ファイルの置き場所 */
const workPath = new Path(__dirname).child('work', 'system');

/** 復号できない（壊れた）設定ファイルの内容 */
const BROKEN_CONTENT = vi.hoisted(() => 'broken content');

// 設定ファイルの暗号化（Electron の safeStorage）は，テストの環境では使えないため差し替える
// （暗号化は内容をそのまま書き，壊れた内容の復号は失敗させて，設定ファイルが壊れている状況を再現する）
vi.mock('electron', () => ({
  // Electron の外で実行していることを表す（保存先などはテスト用のものを使う）
  app: undefined,
  safeStorage: {
    encryptString: (text: string) => Buffer.from(text),
    decryptString: (data: Buffer) => {
      const text = data.toString();
      if (text === BROKEN_CONTENT) throw new Error('broken settings');
      return text;
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

/** 作業フォルダにある，読み込めなかった設定ファイルのバックアップの一覧 */
async function listBackups() {
  const files = await workPath.iter();
  if (!Array.isArray(files)) throw new Error('failed to list files');
  return files.filter((f) =>
    f.basename().startsWith('settings.ssconfig.broken-')
  );
}

beforeEach(async () => {
  await workPath.emptyDir();
  // 設定は一度読み込むと保持されるため，テストごとに読み込み直す
  vi.resetModules();
});

describe('システム設定の読み込み', () => {
  test('設定ファイルを読み込めない場合は，ファイルをバックアップして既定値で起動し，画面の準備後に通知する', async () => {
    const settingPath = workPath.child('settings.ssconfig');
    await settingPath.writeText(BROKEN_CONTENT);

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
    expect(await backups[0].readText()).toBe(BROKEN_CONTENT);

    // 画面の準備ができた時点でユーザーへ通知する
    await readyWindow();
    expect(api.send.Error).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'core.brokenSystemSettings' })
    );
  });

  test('既定値で起動しても，共有の既定値は書き換えられない', async () => {
    await workPath.child('settings.ssconfig').writeText(BROKEN_CONTENT);
    const { getSystemSettings } = await import('./system');
    const { DEFAULT_SYSTEM_SETTINGS } =
      await import('app/src-electron/schema/system');
    const before = structuredClone(DEFAULT_SYSTEM_SETTINGS);

    const settings = await getSystemSettings();
    settings.user.language = settings.user.language === 'ja' ? 'en-US' : 'ja';

    expect(DEFAULT_SYSTEM_SETTINGS).toEqual(before);
  });

  test('設定ファイルが無い場合（初回起動）は，バックアップも通知もせずに既定値で起動する', async () => {
    const { getSystemSettings } = await import('./system');
    const { DEFAULT_SYSTEM_SETTINGS } =
      await import('app/src-electron/schema/system');
    const { readyWindow } =
      await import('app/src-electron/lifecycle/lifecycle');
    const { api } = await import('app/src-electron/core/api');
    vi.mocked(api.send.Error).mockClear();

    expect(await getSystemSettings()).toEqual(DEFAULT_SYSTEM_SETTINGS);

    const files = await workPath.iter();
    const names = Array.isArray(files) ? files.map((f) => f.basename()) : [];
    expect(names.some((n) => n.startsWith('settings.ssconfig.broken-'))).toBe(
      false
    );
    await readyWindow();
    expect(api.send.Error).not.toHaveBeenCalled();
  });

  test('保存期間（7日）を過ぎたバックアップは削除し，期間内のものは残す', async () => {
    const dayjs = (await import('dayjs')).default;
    const name = (daysAgo: number) =>
      `settings.ssconfig.broken-${dayjs().subtract(daysAgo, 'd').format('YYYYMMDD-HHmmss')}`;
    const expired = workPath.child(name(8));
    const recent = workPath.child(name(1));
    // 日時の書式でない名前のファイルは，ユーザーが残したものとみなして削除しない
    const renamed = workPath.child('settings.ssconfig.broken-keep');
    await expired.writeText('old');
    await recent.writeText('new');
    await renamed.writeText('keep');

    const { getSystemSettings } = await import('./system');
    await getSystemSettings();

    expect(await expired.exists()).toBe(false);
    expect(await recent.exists()).toBe(true);
    expect(await renamed.exists()).toBe(true);
  });

  test('作成直後のバックアップは，更新日時が古くても次の起動で削除せずに残す', async () => {
    const settingPath = workPath.child('settings.ssconfig');
    await settingPath.writeText(BROKEN_CONTENT);

    const first = await import('./system');
    await first.getSystemSettings();
    const created = await listBackups();
    expect(created).toHaveLength(1);
    // Windows のファイルのコピーは元の更新日時を引き継ぐため，長く起動していなかった場合はバックアップの更新日時も古くなる
    // （OS によらず同じ状況を再現するため，バックアップの更新日時を 8 日前にする）
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await utimes(created[0].path, eightDaysAgo, eightDaysAgo);

    // アプリを再起動する（設定を読み込み直す）
    vi.resetModules();
    const second = await import('./system');
    await second.getSystemSettings();

    const backups = await listBackups();
    expect(backups).toHaveLength(1);
    expect(await backups[0].readText()).toBe(BROKEN_CONTENT);
  });

  test('バックアップできなかった場合は，読み込めなかった設定ファイルを上書きせず，その旨を通知する', async () => {
    const settingPath = workPath.child('settings.ssconfig');
    await settingPath.writeText(BROKEN_CONTENT);
    // ファイルのコピー（外部ライブラリ）を失敗させて，バックアップできない状況を再現する
    const copy = vi
      .spyOn(fs, 'copy')
      .mockRejectedValueOnce(new Error('EACCES: permission denied'));
    try {
      const { getSystemSettings, setSystemSettings } = await import('./system');
      const { readyWindow } =
        await import('app/src-electron/lifecycle/lifecycle');
      const { api } = await import('app/src-electron/core/api');
      vi.mocked(api.send.Error).mockClear();

      const settings = await getSystemSettings();
      settings.user.language = settings.user.language === 'ja' ? 'en-US' : 'ja';
      await setSystemSettings(settings);

      // 設定の変更はアプリの動作中には反映されるが，ファイルは上書きしない
      expect(await getSystemSettings()).toEqual(settings);
      expect(await settingPath.readText()).toBe(BROKEN_CONTENT);
      await readyWindow();
      expect(api.send.Error).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'core.brokenSystemSettingsWithoutBackup',
        })
      );
    } finally {
      copy.mockRestore();
    }
  });

  test('最初の読み込みの途中で保存しても，読み込めなかった設定ファイルはバックアップされ，保存した内容が使われる', async () => {
    const settingPath = workPath.child('settings.ssconfig');
    await settingPath.writeText(BROKEN_CONTENT);
    const { getSystemSettings, setSystemSettings } = await import('./system');
    const { DEFAULT_SYSTEM_SETTINGS } =
      await import('app/src-electron/schema/system');
    const saved = structuredClone(DEFAULT_SYSTEM_SETTINGS);
    saved.user.language = saved.user.language === 'ja' ? 'en-US' : 'ja';

    // 読み込みの完了を待たずに保存する
    await Promise.all([getSystemSettings(), setSystemSettings(saved)]);

    const backups = await listBackups();
    expect(backups).toHaveLength(1);
    expect(await backups[0].readText()).toBe(BROKEN_CONTENT);
    expect(await getSystemSettings()).toEqual(saved);
  });
});
