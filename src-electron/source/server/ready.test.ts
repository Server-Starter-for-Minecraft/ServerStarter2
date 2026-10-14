import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { versionContainer } from 'app/src-electron/core/setup';
import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { WorldSettings } from '../world/files/json';
import { readyRunServer } from './ready';

// サーバーデータ・Javaの準備（ダウンロード等）は行わず，呼び出されたかどうかのみを確認する
vi.mock('app/src-electron/core/setup', () => ({
  runtimeContainer: { ready: vi.fn() },
  versionContainer: { readyVersion: vi.fn() },
}));
vi.mock('app/src-electron/core/api', () => ({ api: {} }));
vi.mock('../../stores/system', () => ({
  getSystemSettings: vi.fn(async () => ({
    world: { memory: { size: 2, unit: 'GB' } },
  })),
}));

/** テスト用のワールド設定 */
function worldSettings(javaArguments: string): WorldSettings {
  return {
    memory: { size: 2, unit: 'GB' },
    javaArguments,
    version: { type: 'vanilla', id: '1.21.4', release: true },
  } as WorldSettings;
}

beforeEach(() => {
  vi.mocked(versionContainer.readyVersion).mockReset();
});

describe('サーバー起動前の準備', () => {
  test('ユーザー定義のJavaの実行時引数が不正な場合は，サーバーデータを準備せずにエラーで中止する', async () => {
    const result = await readyRunServer(
      new Path('.'),
      'world-id' as WorldID,
      worldSettings('-Da="b c'),
      new GroupProgressor()
    );

    expect(isError(result)).toBe(true);
    expect(versionContainer.readyVersion).not.toHaveBeenCalled();
  });
});
