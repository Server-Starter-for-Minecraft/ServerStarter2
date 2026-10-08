import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { SCHEMA_VERSION_KEY, VersionedSchema } from './versionedSchema';

/**
 * テスト用の設定ファイルの形式の変遷
 *
 * - バージョン0: { name }
 * - バージョン1: { name, port }（portを追加）
 * - バージョン2: { displayName, port }（nameをdisplayNameに改名）
 */
const Settings = z.object({
  displayName: z.string(),
  port: z.number(),
});
const settingsSchema = new VersionedSchema(Settings, [
  (data) => ({ ...data, port: 25565 }),
  ({ name, ...rest }) => ({ ...rest, displayName: name }),
]);

describe('VersionedSchema', () => {
  test('バージョンが記録されていない設定ファイルは、バージョン0から最新の形式に変換して読み込む', () => {
    const result = settingsSchema.safeParse({ name: 'world' });

    expect(result.success && result.data).toEqual({
      displayName: 'world',
      port: 25565,
    });
  });

  test('途中のバージョンの設定ファイルは、そのバージョン以降の変換のみを行う', () => {
    const result = settingsSchema.safeParse({
      name: 'world',
      port: 30000,
      [SCHEMA_VERSION_KEY]: 1,
    });

    expect(result.success && result.data).toEqual({
      displayName: 'world',
      port: 30000,
    });
  });

  test('保存した設定ファイルを読み込むと、保存前の値に戻る', () => {
    const value = { displayName: 'world', port: 30000 };
    const saved = JSON.parse(JSON.stringify(settingsSchema.serialize(value)));

    expect(saved[SCHEMA_VERSION_KEY]).toBe(settingsSchema.latestVersion);
    const result = settingsSchema.safeParse(saved);
    expect(result.success && result.data).toEqual(value);
  });

  test('新しいバージョンのアプリで保存された設定ファイルも、解釈できる項目は読み込む', () => {
    const result = settingsSchema.safeParse({
      displayName: 'world',
      port: 30000,
      futureOption: true,
      [SCHEMA_VERSION_KEY]: settingsSchema.latestVersion + 1,
    });

    expect(result.success && result.data).toEqual({
      displayName: 'world',
      port: 30000,
    });
  });

  test('バージョンの記録が不正な場合はバージョン0として扱う', () => {
    const result = settingsSchema.safeParse({
      name: 'world',
      [SCHEMA_VERSION_KEY]: 'invalid',
    });

    expect(result.success && result.data).toEqual({
      displayName: 'world',
      port: 25565,
    });
  });

  test('変換処理が入れ子の値を変更しても、読み込んだ元の内容は変更されない', () => {
    const nested = new VersionedSchema(
      z.object({ inner: z.object({ v: z.number() }) }),
      [
        (data) => {
          (data.inner as { v: number }).v += 1;
          return data;
        },
      ]
    );
    const raw = { inner: { v: 1 } };

    const result = nested.parse(raw);

    expect(result.inner.v).toBe(2);
    expect(raw.inner.v).toBe(1);
  });

  test('想定外の形式により変換処理が失敗した場合は、検証の失敗として返す', () => {
    const nested = new VersionedSchema(
      z.object({ inner: z.object({ v: z.number() }) }),
      [
        (data) => ({
          ...data,
          inner: { v: (data.inner as { v: number }).v + 1 },
        }),
      ]
    );

    const result = nested.safeParse({ inner: null });

    expect(result.success).toBe(false);
  });
});
