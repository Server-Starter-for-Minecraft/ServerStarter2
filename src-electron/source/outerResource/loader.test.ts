import { LocalResponse, startLocalServer } from 'app/test/util/localServer';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { z } from 'zod';
import { lenientArray } from 'app/src-electron/schema/outerResource/common';
import { Path } from 'app/src-electron/util/binary/path';
import { isError, isValid } from 'app/src-electron/util/error/error';
import { genUUID } from 'app/src-electron/util/random/uuid';
import { OuterResource, OuterResourceDefinition } from './loader';

/** テスト用の外部リソース（文字列の一覧） */
const Item = z.object({ name: z.string(), image: z.string().optional() });
const Wire = z.object({ items: z.array(Item) });
type Wire = z.infer<typeof Wire>;

/** 画像を data URI に解決したもの */
type Resolved = { names: string[]; images: (string | undefined)[] };

const definition: OuterResourceDefinition<Wire, Resolved> = {
  key: 'test',
  schemaVersion: 1,
  fileName: 'items.json',
  schema: Wire,
  parser: z.object({ items: lenientArray(Item) }),
  bundled: { items: [{ name: 'bundled' }] },
  async resolve(wire, ctx) {
    const images = await Promise.all(
      wire.items.map(async ({ image }) => {
        if (image === undefined) return undefined;
        const loaded = await ctx.loadImage(image);
        return isValid(loaded) ? loaded : undefined;
      })
    );
    return { names: wire.items.map((i) => i.name), images };
  },
};

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const json = (body: unknown): LocalResponse => ({
  body: JSON.stringify(body),
  contentType: 'application/json',
});

const workPath = new Path(__dirname).child('work', 'loader');

/** 毎回空のキャッシュディレクトリを用意する */
function newCacheDir() {
  return workPath.child(genUUID());
}

/** 配布元に到達できない状態を表す URL（ポート 9 は通常使われない） */
const UNREACHABLE = 'http://127.0.0.1:9/serverstarter2';

describe('OuterResource', () => {
  let server: Awaited<ReturnType<typeof startLocalServer>>;
  /** テストごとに配布元の内容を差し替えられるようにする */
  const routes: Record<string, LocalResponse> = {};

  beforeAll(async () => {
    // サーバーはリクエストのたびに routes を参照するため，起動後に内容を差し替えられる
    server = await startLocalServer(routes);
  });
  afterAll(async () => {
    await server.close();
    await workPath.remove();
  });

  const baseUrl = () => server.url('/base');

  test('配布元に到達できずキャッシュもない場合は同梱の内容を使う', async () => {
    const resource = new OuterResource(definition, {
      baseUrl: UNREACHABLE,
      cacheDir: newCacheDir(),
    });
    expect(isError(await resource.refresh())).toBe(true);
    expect((await resource.get()).names).toEqual(['bundled']);
  });

  test('配布元の内容に更新でき，次回の起動時はオフラインでもその内容を使う', async () => {
    routes['/base/v1/items.json'] = json({ items: [{ name: 'remote' }] });
    const cacheDir = newCacheDir();

    const online = new OuterResource(definition, {
      baseUrl: baseUrl(),
      cacheDir,
    });
    expect((await online.get()).names).toEqual(['bundled']);
    const refreshed = await online.refresh();
    expect(isValid(refreshed) && refreshed.names).toEqual(['remote']);
    expect((await online.get()).names).toEqual(['remote']);

    const offline = new OuterResource(definition, {
      baseUrl: UNREACHABLE,
      cacheDir,
    });
    await offline.refresh();
    expect((await offline.get()).names).toEqual(['remote']);
  });

  test('配布元の内容が不正な場合は，表示中の内容もキャッシュも変えない', async () => {
    const cacheDir = newCacheDir();
    routes['/base/v1/items.json'] = json({ items: [{ name: 'first' }] });
    await new OuterResource(definition, {
      baseUrl: baseUrl(),
      cacheDir,
    }).refresh();

    routes['/base/v1/items.json'] = { body: '{ broken json' };
    const resource = new OuterResource(definition, {
      baseUrl: baseUrl(),
      cacheDir,
    });
    expect(isError(await resource.refresh())).toBe(true);
    expect((await resource.get()).names).toEqual(['first']);

    routes['/base/v1/items.json'] = json({ items: 'not array' });
    expect(isError(await resource.refresh())).toBe(true);

    const restarted = new OuterResource(definition, {
      baseUrl: UNREACHABLE,
      cacheDir,
    });
    expect((await restarted.get()).names).toEqual(['first']);
  });

  test('キャッシュが壊れている場合は同梱の内容を使う', async () => {
    const cacheDir = newCacheDir();
    await cacheDir.child('v1', 'items.json').writeText('{ broken');
    const resource = new OuterResource(definition, {
      baseUrl: UNREACHABLE,
      cacheDir,
    });
    expect((await resource.get()).names).toEqual(['bundled']);
  });

  test('不正な要素だけを除いて読み込む', async () => {
    routes['/base/v1/items.json'] = json({
      items: [{ name: 'ok' }, { name: 1 }, { name: 'ok2', unknown: true }],
    });
    const resource = new OuterResource(definition, {
      baseUrl: baseUrl(),
      cacheDir: newCacheDir(),
    });
    await resource.refresh();
    expect((await resource.get()).names).toEqual(['ok', 'ok2']);
  });

  test('スキーマのバージョンごとの場所から取得する', async () => {
    routes['/base/v2/items.json'] = json({ items: [{ name: 'v2' }] });
    routes['/base/v1/items.json'] = json({ items: [{ name: 'v1' }] });
    const resource = new OuterResource(
      { ...definition, schemaVersion: 2 },
      { baseUrl: baseUrl(), cacheDir: newCacheDir() }
    );
    await resource.refresh();
    expect((await resource.get()).names).toEqual(['v2']);
  });

  describe('画像の読み込み', () => {
    test('配布ファイルからの相対パスの画像を data URI にし，次回はオフラインでも表示できる', async () => {
      routes['/base/v1/items.json'] = json({
        items: [{ name: 'a', image: 'icons/a.png' }],
      });
      routes['/base/v1/icons/a.png'] = { body: PNG, contentType: 'image/png' };
      const cacheDir = newCacheDir();
      const online = new OuterResource(definition, {
        baseUrl: baseUrl(),
        cacheDir,
      });
      await online.refresh();
      const expected = `data:image/png;base64,${PNG.toString('base64')}`;
      expect((await online.get()).images).toEqual([expected]);

      const offline = new OuterResource(definition, {
        baseUrl: UNREACHABLE,
        cacheDir,
      });
      expect((await offline.get()).images).toEqual([expected]);
    });

    test('画像の data URI はそのまま使う', async () => {
      const uri = `data:image/png;base64,${PNG.toString('base64')}`;
      const resource = new OuterResource(
        { ...definition, bundled: { items: [{ name: 'a', image: uri }] } },
        { baseUrl: UNREACHABLE, cacheDir: newCacheDir() }
      );
      expect((await resource.get()).images).toEqual([uri]);
    });

    test.each([
      ['取得できない画像', 'icons/missing.png'],
      ['画像以外の data URI', 'data:text/html;base64,PGgxPg=='],
      ['画像以外の拡張子', 'icons/script.js'],
      ['配布元と異なる http の URL', 'http://example.com/a.png'],
    ])('%s は読み込まない', async (_, image) => {
      routes['/base/v1/items.json'] = json({ items: [{ name: 'a', image }] });
      routes['/base/v1/icons/script.js'] = { body: 'alert(1)' };
      const resource = new OuterResource(definition, {
        baseUrl: baseUrl(),
        cacheDir: newCacheDir(),
      });
      await resource.refresh();
      expect(await resource.get()).toEqual({
        names: ['a'],
        images: [undefined],
      });
    });
  });
});
