import { assertOk } from 'app/test/util/assert';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { z } from 'zod';
import type { OuterResourceDefinition } from 'app/src-electron/source/outerResource/definition';
import { Path } from 'app/src-electron/util/binary/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { buildBundledContent, createDistributionReader } from './pull';

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

/** テスト用の外部リソース（画像の一覧） */
const Wire = z.object({ images: z.array(z.string()) });
type Wire = z.infer<typeof Wire>;

const definition: OuterResourceDefinition<Wire, Wire> = {
  key: 'test',
  schemaVersion: 1,
  fileName: 'images.json',
  schema: Wire,
  parser: Wire,
  bundled: { images: [] },
  async embedAssets(wire, loadImage) {
    const images = await Promise.all(wire.images.map(loadImage));
    return images.find(isError) ?? { images: images.filter(isValid) };
  },
  async resolve(wire) {
    return wire;
  },
};

const PNG_DATA_URI = `data:image/png;base64,${Buffer.from('png').toString('base64')}`;

describe('同梱する内容の作成', () => {
  const dir = new Path(__dirname).child('work', genUUID());
  const distribution = dir.child('serverstarter2');
  const read = createDistributionReader(distribution.path);

  /** 配布ファイルを置いて，同梱する内容を作る */
  const build = async (content: unknown) => {
    assertOk(
      await distribution
        .child('v1', 'images.json')
        .writeText(JSON.stringify(content))
    );
    return buildBundledContent(definition, read);
  };

  beforeAll(async () => {
    assertOk(await distribution.child('v1', 'icons', 'a.png').writeText('png'));
    assertOk(await dir.child('secret.png').writeText('secret'));
  });
  afterAll(async () => {
    assertOk(await dir.remove());
  });

  test.each(['icons/a.png', PNG_DATA_URI])(
    '配布元の画像 %s を data URI として取り込む',
    async (image) => {
      expect(await build({ images: [image] })).toEqual({
        images: [PNG_DATA_URI],
      });
    }
  );

  test.each([
    'http://example.com/a.png',
    'icons/a.gif',
    '../../secret.png',
    'data:text/plain;base64,cG5n',
  ])('取り込めない画像 %s を参照する場合は失敗する', async (image) => {
    expect(isError(await build({ images: [image] }))).toBe(true);
  });

  test('配布ファイルがスキーマを満たさない場合は失敗する', async () => {
    expect(isError(await build({ images: [1] }))).toBe(true);
  });
});
