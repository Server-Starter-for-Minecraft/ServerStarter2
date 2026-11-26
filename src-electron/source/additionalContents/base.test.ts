import { assertOk } from 'app/test/util/assert';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LEVEL_NAME } from 'app/src-electron/source/const';
import { Path } from 'app/src-electron/util/binary/path';

const workPath = new Path(__dirname).child('work', 'base');

// 導入したコンテンツはキャッシュにもコピーされるため，開発用のキャッシュを汚さないように作業フォルダへ差し替える
vi.mock('app/src-electron/source/const', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('app/src-electron/source/const')>();
  const { Path } = await import('app/src-electron/util/binary/path');
  const base = new Path(__dirname).child('work', 'base', 'cache');
  return {
    ...original,
    DATAPACK_CACHE_PATH: base.child('datapacks'),
    PLUGIN_CACHE_PATH: base.child('plugins'),
    MOD_CACHE_PATH: base.child('mods'),
  };
});
// キャッシュへのコピーに失敗した場合の通知はテストでは送らない
vi.mock('app/src-electron/core/api', () => ({
  api: { send: { Error: vi.fn() } },
}));

const { modFiles } = await import('./mod/mod');
const { datapackFiles } = await import('./datapack/datapack');

const sourceDir = workPath.child('source');
const serverPath = workPath.child('server');
const cachePath = workPath.child('cache');

beforeEach(async () => {
  await workPath.emptyDir();
  await sourceDir.mkdir(true);
  await serverPath.mkdir(true);
});

describe('追加コンテンツのワールドへの導入', () => {
  test('jar ファイルの MOD を導入でき，キャッシュにもコピーされる', async () => {
    const jarPath = sourceDir.child('SampleMod.jar');
    await jarPath.writeText('dummy jar');
    const newMod = await modFiles.loadNew(jarPath);
    assertOk(newMod);

    const saved = await modFiles.save(serverPath, [newMod]);

    expect(saved.errors).toEqual([]);
    expect(await serverPath.child('mods', 'SampleMod.jar').readText()).toBe(
      'dummy jar'
    );
    // キャッシュへのコピーは待機せずに行われるため，完了を待つ
    await vi.waitFor(async () => {
      expect(await cachePath.child('mods', 'SampleMod.jar').exists()).toBe(
        true
      );
    });
  });

  test('フォルダのデータパックを導入でき，導入元に余計なフォルダを作らない', async () => {
    const packPath = sourceDir.child('SamplePack');
    await packPath
      .child('pack.mcmeta')
      .writeText(
        JSON.stringify({ pack: { pack_format: 48, description: 'sample' } })
      );
    const newPack = await datapackFiles.loadNew(packPath);
    assertOk(newPack);

    const saved = await datapackFiles.save(serverPath, [newPack]);

    expect(saved.errors).toEqual([]);
    const installed = serverPath.child(LEVEL_NAME, 'datapacks', 'SamplePack');
    expect(await installed.child('pack.mcmeta').exists()).toBe(true);
    // 導入元・導入先のデータパックの中身は pack.mcmeta のみのまま
    await vi.waitFor(async () => {
      // フォルダの作成後に中身がコピーされるため，中身のコピーの完了を待つ
      expect(
        await cachePath.child('datapacks', 'SamplePack', 'pack.mcmeta').exists()
      ).toBe(true);
    });
    for (const dir of [packPath, installed]) {
      const children = await dir.iter();
      assertOk(children);
      expect(children.map((p) => p.basename())).toEqual(['pack.mcmeta']);
    }
  });

  test('有効なコンテンツでないものは導入せずエラーを返す', async () => {
    const textPath = sourceDir.child('NotMod.txt');
    await textPath.writeText('not a mod');

    const saved = await modFiles.save(serverPath, [
      {
        kind: 'mod',
        type: 'new',
        name: 'NotMod',
        ext: '.txt',
        path: textPath.path,
        isFile: true,
      },
    ]);

    expect(saved.errors).toHaveLength(1);
    expect(await serverPath.child('mods', 'NotMod.txt').exists()).toBe(false);
  });
});
