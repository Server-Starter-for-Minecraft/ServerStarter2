import { beforeAll, describe, expect, test } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { SCHEMA_VERSION_KEY } from 'app/src-electron/util/versioning/versionedSchema';
import { serverJsonFile, WorldSettings } from './json';

const workPath = new Path(__dirname).child('work', 'json');

/** テスト用のワールド設定 */
const settings: WorldSettings = {
  memory: { size: 2, unit: 'GB' },
  version: { type: 'vanilla', id: '1.21.1', release: true },
  using: false,
  ngrok_setting: { use_ngrok: false },
} as WorldSettings;

beforeAll(async () => {
  await workPath.emptyDir();
});

describe('server_settings.json', () => {
  test('保存した設定ファイルにはスキーマのバージョンが記録され、読み込むと保存前の値に戻る', async () => {
    const dir = workPath.child('roundtrip');
    await dir.mkdir(true);

    await serverJsonFile.save(dir, settings);
    const raw = JSON.parse(
      (await serverJsonFile.path(dir).readText()) as string
    );
    const loaded = await serverJsonFile.load(dir);

    expect(raw[SCHEMA_VERSION_KEY]).toEqual(expect.any(Number));
    expect(isError(loaded)).toBe(false);
    expect(loaded).toEqual(settings);
  });

  test('スキーマのバージョン管理を導入する前に保存された設定ファイルも読み込める', async () => {
    const dir = workPath.child('legacy');
    await dir.mkdir(true);
    await serverJsonFile.path(dir).writeText(JSON.stringify(settings));

    const loaded = await serverJsonFile.load(dir);

    expect(loaded).toEqual(settings);
  });
});
