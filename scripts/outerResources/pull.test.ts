import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { createDistributionReader } from './pull';

/** テスト用の配布元（OuterResources の `serverstarter2/` に相当するディレクトリ） */
const workDir = join(__dirname, 'work', genUUID());
const root = join(workDir, 'serverstarter2');

describe('ローカルの配布元の読み込み', () => {
  beforeAll(async () => {
    await mkdir(join(root, 'v1', 'icons'), { recursive: true });
    await writeFile(join(root, 'v1', 'icons', 'logo#dark.png'), 'png');
    await writeFile(join(workDir, 'secret.png'), 'secret');
  });
  afterAll(() => rm(workDir, { recursive: true, force: true }));

  const read = createDistributionReader(root);

  test('エンコードした表記のパスでファイルを読み込む', async () => {
    expect((await read('v1/icons/logo%23dark.png')).toString()).toBe('png');
  });

  test.each(['v1/..%2f..%2fsecret.png', '../secret.png'])(
    '配布元の外を指すパス %s は読み込まない',
    async (path) => {
      await expect(read(path)).rejects.toThrow();
    }
  );
});
