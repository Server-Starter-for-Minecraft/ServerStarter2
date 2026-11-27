import JSZip from 'jszip';
import { writeFile } from 'node:fs/promises';
import { beforeAll, describe, expect, test } from 'vitest';
import { WorldID } from 'app/src-electron/schema/world';
import { LEVEL_NAME } from 'app/src-electron/source/const';
import { Path } from 'app/src-electron/util/binary/path';
import { datapackFiles } from './datapack';

const workPath = new Path(__dirname).child('work', 'datapack');
const mcmeta = JSON.stringify({
  pack: { pack_format: 48, description: 'test pack' },
});

beforeAll(async () => {
  await workPath.emptyDir();
  const datapacks = workPath.child(LEVEL_NAME, 'datapacks');

  // zip形式のデータパック
  const zip = new JSZip();
  zip.file('pack.mcmeta', mcmeta);
  await datapacks.mkdir(true);
  await writeFile(
    datapacks.child('ZipPack.zip').path,
    await zip.generateAsync({ type: 'uint8array' })
  );

  // フォルダ形式のデータパック
  await datapacks.child('FolderPack').mkdir(true);
  await datapacks.child('FolderPack', 'pack.mcmeta').writeText(mcmeta);
});

describe('ワールドのデータパックの読み込み', () => {
  test('zip形式とフォルダ形式のデータパックを区別して読み込む', async () => {
    const loaded = await datapackFiles.load(workPath, 'world-id' as WorldID);

    const isFile = Object.fromEntries(
      loaded.value.map((d) => [d.name, d.isFile])
    );
    expect(isFile).toEqual({ ZipPack: true, FolderPack: false });
  });
});

describe('ワールドのデータパックの保存', () => {
  const savePath = new Path(__dirname).child('work', 'datapack-save');
  const datapacks = savePath.child(LEVEL_NAME, 'datapacks');

  beforeAll(async () => {
    await savePath.emptyDir();
    await datapacks.mkdir(true);
    // 同じ名前のzip形式とフォルダ形式のデータパック
    const zip = new JSZip();
    zip.file('pack.mcmeta', mcmeta);
    await writeFile(
      datapacks.child('SamePack.zip').path,
      await zip.generateAsync({ type: 'uint8array' })
    );
    await datapacks.child('SamePack').mkdir(true);
    await datapacks.child('SamePack', 'pack.mcmeta').writeText(mcmeta);
  });

  test('同じ名前のフォルダとファイルのうち、一覧から除いた方のみを削除する', async () => {
    const loaded = await datapackFiles.load(savePath, 'world-id' as WorldID);
    const kept = loaded.value.filter((d) => !d.isFile);

    // 保存先にあるデータパックのみを渡すため、新たに導入するものはない
    // （テストではワールドを登録していないため導入元の取得はエラーとなるが、削除の結果には影響しないため検証しない）

    await datapackFiles.save(savePath, kept);

    expect(await datapacks.child('SamePack.zip').exists()).toBe(false);
    expect(await datapacks.child('SamePack', 'pack.mcmeta').exists()).toBe(
      true
    );
  });
});

describe('pack.mcmetaの形式ごとのデータパックの読み込み', () => {
  const formatPath = new Path(__dirname).child('work', 'datapack-format');

  /**
   * 指定した文字列を pack.mcmeta に持つフォルダ形式のデータパックを作成して読み込む
   *
   * @param name データパックのフォルダ名
   * @param text pack.mcmeta に書き込む文字列
   * @returns 読み込み結果
   */
  async function loadWithMcmetaText(name: string, text: string) {
    const packPath = formatPath.child(name);
    await packPath.mkdir(true);
    await packPath.child('pack.mcmeta').writeText(text);
    return datapackFiles.loadNew(packPath);
  }

  /**
   * 指定した内容の pack.mcmeta を持つフォルダ形式のデータパックを作成して読み込む
   *
   * @param name データパックのフォルダ名
   * @param meta pack.mcmeta の内容（JSONとして書き込む）
   * @returns 読み込み結果
   */
  async function loadWithMcmeta(name: string, meta: unknown) {
    return loadWithMcmetaText(name, JSON.stringify(meta));
  }

  test.each<[string, string, string]>([
    ['JSONとして読めない', 'BrokenJson', '{ "pack": '],
    ['packを持たない', 'NoPack', JSON.stringify({ description: 'no pack' })],
  ])(
    '%s pack.mcmeta は、データパックとして不適な旨のエラーを返す',
    async (_, name, text) => {
      const loaded = await loadWithMcmetaText(name, text);
      expect(loaded).toMatchObject({
        key: 'data.path.invalidContent.invalidDatapack',
      });
    }
  );

  test('zip形式で pack.mcmeta が不適な場合も、データパックとして不適な旨のエラーを返す', async () => {
    const zip = new JSZip();
    zip.file('pack.mcmeta', JSON.stringify({ description: 'no pack' }));
    const zipPath = formatPath.child('BrokenZip.zip');
    await writeFile(
      zipPath.path,
      await zip.generateAsync({ type: 'uint8array' })
    );

    const loaded = await datapackFiles.loadNew(zipPath);
    expect(loaded).toMatchObject({
      key: 'data.path.invalidContent.invalidDatapack',
    });
  });

  beforeAll(async () => {
    await formatPath.emptyDir();
  });

  test('旧形式（pack_format）のデータパックを読み込める', async () => {
    const loaded = await loadWithMcmeta('OldFormat', {
      pack: { pack_format: 48, description: 'old pack' },
    });
    expect(loaded).toMatchObject({ kind: 'datapack', description: 'old pack' });
  });

  test('1.21.9以降の形式（pack_formatが無く、min_format / max_formatを持つ）のデータパックを読み込める', async () => {
    const loaded = await loadWithMcmeta('NewFormat', {
      pack: {
        description: 'new pack',
        min_format: [101, 1],
        max_format: 101,
      },
    });
    expect(loaded).toMatchObject({ kind: 'datapack', description: 'new pack' });
  });

  test('説明が無いデータパックは、説明を空文字として読み込める', async () => {
    const loaded = await loadWithMcmeta('NoDescription', {
      pack: { min_format: 101, max_format: 101 },
    });
    expect(loaded).toMatchObject({ kind: 'datapack', description: '' });
  });

  test('テキストコンポーネントで記述された説明を文字列として読み込める', async () => {
    const loaded = await loadWithMcmeta('ComponentDesc', {
      pack: {
        description: [
          { text: 'Data pack ', extra: [{ text: 'for ', bold: true }] },
          { translate: 'pack.key', fallback: 'Bukkit' },
        ],
        min_format: 101,
        max_format: 101,
      },
    });
    expect(loaded).toMatchObject({
      kind: 'datapack',
      description: 'Data pack for Bukkit',
    });
  });
});
