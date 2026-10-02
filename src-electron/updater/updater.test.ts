import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SystemSettings } from '../schema/system';
import { UpdateAttempt } from './attempt';

const LATEST = 'v9.9.9';

/** 保存された自動アップデートの実行記録（ファイルの代わり） */
let savedAttempt: UpdateAttempt | undefined;

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
// 実行記録の判定処理はそのままに、ファイルへの保存のみ置き換える
vi.mock('./attempt', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./attempt')>()),
  loadUpdateAttempt: async () => savedAttempt,
  saveUpdateAttempt: async (attempt: UpdateAttempt) => {
    savedAttempt = attempt;
  },
}));

const { update } = await import('./updater');
const { installWindows } = await import('./installer/windows');
const { notifyUpdate } = await import('./notify');

beforeEach(() => {
  savedAttempt = undefined;
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
});
