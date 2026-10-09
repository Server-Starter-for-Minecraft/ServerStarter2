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

    expect(datapacks.child('SamePack.zip').exists()).toBe(false);
    expect(datapacks.child('SamePack', 'pack.mcmeta').exists()).toBe(true);
  });
});
