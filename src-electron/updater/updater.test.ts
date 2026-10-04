import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SystemSettings } from '../schema/system';
import { Path } from '../util/binary/path';

const LATEST = 'v9.9.9';

/** テスト用のServerStarter2のデータの保存先 */
const workPath = new Path(__dirname).child('work', 'updater');

vi.mock('electron', () => ({ app: undefined }));
vi.mock('../util/os/os', () => ({ osPlatform: 'windows-x64' }));
vi.mock('./version', () => ({ getSystemVersion: async () => '2.2.0' }));
vi.mock('./fetch', () => ({
  getLatestRelease: async () => ({
    platform: 'windows-x64',
    version: LATEST,
    url: 'https://example.com/ServerStarter2.msi',
  }),
}));
vi.mock('./installer/windows', () => ({ installWindows: vi.fn() }));
vi.mock('./installer/mac', () => ({ installMac: vi.fn() }));
vi.mock('./notify', () => ({ notifyUpdate: vi.fn() }));
vi.mock('../source/stores/system', () => ({
  getSystemSettings: async () => SystemSettings.parse({}),
  setSystemSettings: async (s: SystemSettings) => s,
}));
// 自動アップデートの実行記録などのデータを、テスト用のフォルダに保存する
vi.mock('../source/const', async (importOriginal) => {
  const { Path } = await import('../util/binary/path');
  return {
    ...(await importOriginal<typeof import('../source/const')>()),
    mainPath: new Path(__dirname).child('work', 'updater'),
  };
});

const { update } = await import('./updater');
const { installWindows } = await import('./installer/windows');
const { notifyUpdate } = await import('./notify');

beforeEach(async () => {
  // 前回のテストでの自動アップデートの実行記録を削除する
  await workPath.emptyDir();
  vi.mocked(installWindows).mockReset();
  vi.mocked(notifyUpdate).mockReset();
});

describe('update', () => {
  test('最新版がある場合は自動アップデートを実行する', async () => {
    vi.mocked(installWindows).mockResolvedValue(true);

    await update();

    expect(installWindows).toHaveBeenCalledTimes(1);
    expect(notifyUpdate).not.toHaveBeenCalled();
  });

  test('アップデートに失敗して古いバージョンで再起動した場合は、アップデートを繰り返さずに手動でのアップデートを促す', async () => {
    // 1回目の起動：インストーラーを起動（インストールに失敗し、古いバージョンのまま再起動したとする）
    vi.mocked(installWindows).mockResolvedValue(true);
    await update();
    // 2回目の起動
    vi.mocked(installWindows).mockClear();
    await update();

    expect(installWindows).not.toHaveBeenCalled();
    expect(notifyUpdate).toHaveBeenCalledWith('windows-x64', '9.9.9');
  });

  test('インストーラーを起動できなかった場合は、その場で手動でのアップデートを促す', async () => {
    vi.mocked(installWindows).mockResolvedValue(false);

    await update();

    expect(notifyUpdate).toHaveBeenCalledWith('windows-x64', '9.9.9');
  });

  test('自動アップデートに対応していないOSでは、最新版があることを通知する', async () => {
    const os = await import('../util/os/os');
    vi.spyOn(os, 'osPlatform', 'get').mockReturnValue('debian');

    await update();

    expect(installWindows).not.toHaveBeenCalled();
    expect(notifyUpdate).toHaveBeenCalledWith('debian', '9.9.9');
  });
});
