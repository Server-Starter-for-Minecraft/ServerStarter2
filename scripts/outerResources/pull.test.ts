import { assertOk } from 'app/test/util/assert';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { createDistributionReader } from './pull';

/** テスト用の配布元（OuterResources の `serverstarter2/` に相当するディレクトリ） */
const workDir = new Path(__dirname).child('work', genUUID());
const root = workDir.child('serverstarter2');

describe('ローカルの配布元の読み込み', () => {
  beforeAll(async () => {
    assertOk(await root.child('v1', 'icons', 'logo#dark.png').writeText('png'));
    assertOk(await workDir.child('secret.png').writeText('secret'));
  });
  afterAll(async () => {
    assertOk(await workDir.remove());
  });

  const read = createDistributionReader(root.path);

  test('エンコードした表記のパスでファイルを読み込む', async () => {
    const data = await read('v1/icons/logo%23dark.png');
    assertOk(data);
    expect(await data.text()).toBe('png');
  });

  test.each(['v1/..%2f..%2fsecret.png', '../secret.png'])(
    '配布元の外を指すパス %s は読み込まない',
    async (path) => {
      expect(isError(await read(path))).toBe(true);
    }
  );
});
