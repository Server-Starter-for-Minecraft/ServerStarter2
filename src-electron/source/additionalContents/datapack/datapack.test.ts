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
