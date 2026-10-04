import { beforeAll, describe, expect, test } from 'vitest';
import { Path } from '../util/binary/path';
import {
  loadUpdateAttempt,
  saveUpdateAttempt,
  shouldAutoInstall,
  UPDATE_RETRY_INTERVAL_MS,
} from './attempt';

const NOW = Date.UTC(2026, 7, 10);
const HOUR = 60 * 60 * 1000;

describe('shouldAutoInstall', () => {
  test('自動アップデートを実行したことが無い場合はアップデートする', () => {
    expect(shouldAutoInstall('v2.3.0', undefined, NOW)).toBe(true);
  });

  test('直近に同じバージョンへのアップデートを実行していた場合は、失敗したとみなしてアップデートしない', () => {
    const lastAttempt = { version: 'v2.3.0', attemptedAt: NOW - HOUR };
    expect(shouldAutoInstall('v2.3.0', lastAttempt, NOW)).toBe(false);
  });

  test('前回のアップデートから一定時間が経過した場合は、再度アップデートを試みる', () => {
    const lastAttempt = {
      version: 'v2.3.0',
      attemptedAt: NOW - UPDATE_RETRY_INTERVAL_MS,
    };
    expect(shouldAutoInstall('v2.3.0', lastAttempt, NOW)).toBe(true);
  });

  test('時計が戻されて実行記録が未来の日時になっている場合は、アップデートを試みる', () => {
    const lastAttempt = { version: 'v2.3.0', attemptedAt: NOW + 3 * 24 * HOUR };
    expect(shouldAutoInstall('v2.3.0', lastAttempt, NOW)).toBe(true);
  });

  test('前回とは別のバージョンが公開された場合はアップデートする', () => {
    const lastAttempt = { version: 'v2.3.0', attemptedAt: NOW - HOUR };
    expect(shouldAutoInstall('v2.3.1', lastAttempt, NOW)).toBe(true);
  });
});

describe('自動アップデートの実行記録', () => {
  const workPath = new Path(__dirname).child('work', 'attempt');
  const attemptPath = workPath.child('update_attempt.json');

  beforeAll(async () => {
    await workPath.emptyDir();
  });

  test('保存した実行記録を次回の起動時に読み込める', async () => {
    const attempt = { version: 'v2.3.0', attemptedAt: NOW };
    await saveUpdateAttempt(attempt, attemptPath);

    await expect(loadUpdateAttempt(attemptPath)).resolves.toEqual(attempt);
  });

  test('実行記録が無い・壊れている場合は記録が無いものとして扱う', async () => {
    await expect(
      loadUpdateAttempt(workPath.child('not_exists.json'))
    ).resolves.toBeUndefined();

    const broken = workPath.child('broken.json');
    await broken.writeText('{ invalid json');
    await expect(loadUpdateAttempt(broken)).resolves.toBeUndefined();
  });
});
