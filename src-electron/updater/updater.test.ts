import { beforeEach, describe, expect, test, vi } from 'vitest';
import { OsPlatform } from '../schema/os';
import { SystemSettings } from '../schema/system';
import { Path } from '../util/binary/path';

/** 起動中のServerStarter2のバージョン */
const CURRENT = '2.2.0';
/** GitHubのリリースから取得する最新版のバージョン（テストごとに変更できる） */
const latest = vi.hoisted(() => ({ version: 'v9.9.9' }));

/** テスト用のServerStarter2のデータの保存先 */
const workPath = new Path(__dirname).child('work', 'updater');

/** 実行環境のOSの状態（テストごとに変更できる） */
const osState = vi.hoisted(() => ({
  platform: 'windows-x64' as OsPlatform,
  underRosetta: false,
}));

vi.mock('electron', () => ({ app: undefined }));
vi.mock('../util/os/os', () => ({
  get osPlatform() {
    return osState.platform;
  },
  isRunningUnderRosetta: () => osState.underRosetta,
}));
vi.mock('./version', () => ({ getSystemVersion: async () => CURRENT }));
// 指定したOS向けのインストーラーを含む最新版のリリースを返す
vi.mock('./fetch', () => ({
  getLatestRelease: async (platform: string) => ({
    platform,
    version: latest.version,
    url: `https://example.com/installer/${platform}`,
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
const { installMac } = await import('./installer/mac');
const { notifyUpdate } = await import('./notify');

beforeEach(async () => {
  // 前回のテストでの自動アップデートの実行記録を削除する
  await workPath.remove();
  await workPath.mkdir(true);
  latest.version = 'v9.9.9';
  osState.platform = 'windows-x64';
  osState.underRosetta = false;
  vi.mocked(installWindows).mockReset();
  vi.mocked(installMac).mockReset();
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

  test('実行記録を保存できない場合は、自動アップデートせずに手動でのアップデートを促す', async () => {
    vi.mocked(installWindows).mockResolvedValue(true);
    // データの保存先をファイルに置き換え、実行記録の保存先フォルダを作成できないようにする
    await workPath.remove();
    await workPath.writeText('');

    await update();

    expect(installWindows).not.toHaveBeenCalled();
    expect(notifyUpdate).toHaveBeenCalledWith('windows-x64', '9.9.9');
  });

  test('自動アップデートに対応していないOSでは、最新版があることを通知する', async () => {
    osState.platform = 'debian';

    await update();

    expect(installWindows).not.toHaveBeenCalled();
    expect(notifyUpdate).toHaveBeenCalledWith('debian', '9.9.9');
  });

  test.each([
    ['起動中と同じバージョン', `v${CURRENT}`],
    ['起動中より古いバージョン', 'v2.1.5'],
  ])(
    '取得した最新版が%sの場合は、アップデートも通知も行わない',
    async (_, version) => {
      latest.version = version;

      await update();

      expect(installWindows).not.toHaveBeenCalled();
      expect(notifyUpdate).not.toHaveBeenCalled();
    }
  );

  test.each([
    ['Intel Mac', false, 'mac-os'],
    ['Apple Silicon上のRosetta', true, 'mac-os-arm64'],
  ])(
    '%sで起動しているIntel版は、実機のアーキテクチャに合ったインストーラーでアップデートする',
    async (_, underRosetta, expectedPlatform) => {
      osState.platform = 'mac-os';
      osState.underRosetta = underRosetta;
      vi.mocked(installMac).mockResolvedValue(true);

      await update();

      expect(installMac).toHaveBeenCalledWith(
        `https://example.com/installer/${expectedPlatform}`,
        undefined
      );
    }
  );
});
