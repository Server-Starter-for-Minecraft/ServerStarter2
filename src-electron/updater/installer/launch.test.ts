import { describe, expect, test } from 'vitest';
import { launchDetached, launchDetachedInShell } from './launch';

describe('launchDetached', () => {
  test('プロセスを起動できた場合は成功を返す', async () => {
    await expect(
      launchDetached(process.execPath, ['-e', '0'], process.cwd())
    ).resolves.toBe(true);
  });

  test('プロセスを起動できなかった場合は失敗を返す', async () => {
    await expect(
      launchDetached('./not-exists-installer', [], process.cwd())
    ).resolves.toBe(false);
  });
});

describe('launchDetachedInShell', () => {
  test('シェルのコマンドラインを起動できた場合は成功を返す', async () => {
    await expect(
      launchDetachedInShell('echo launched', process.cwd())
    ).resolves.toBe(true);
  });
});
