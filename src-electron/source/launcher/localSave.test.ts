import prismarineNbt, { NBT, Tags, TagType } from 'prismarine-nbt';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { gzipSync } from 'zlib';
import { z } from 'zod';
import {
  SystemLocalSaveSetting,
  SystemSettings,
} from 'app/src-electron/schema/system';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { getSystemSettings } from '../stores/system';
import { getLocalSaveContainers } from './launcherProfile';
import { getAllLocalSaveData, getLocalSaveData } from './localSave';

// システム設定と，ランチャーの設定から自動検出される保存先はテストごとに指定する
vi.mock('../stores/system', () => ({ getSystemSettings: vi.fn() }));
vi.mock('./launcherProfile', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./launcherProfile')>()),
  getLocalSaveContainers: vi.fn(),
}));

const nbt = prismarineNbt;
const workPath = new Path(__dirname).child('work', 'localSave');
const savesPath = workPath.child('saves');

/** level.dat の Data タグの中身(タグ名とタグの組) */
type LevelDatTags = Record<string, Tags[TagType]>;

/**
 * Minecraftと同じ形式(gzip圧縮したNBT)で level.dat を持つワールドを作成する
 * @param dirName ワールドのディレクトリ名
 * @param data level.dat の Data タグの中身
 * @param container ワールドを作成する保存先ディレクトリ
 */
async function createWorld(
  dirName: string,
  data: LevelDatTags,
  container: Path = savesPath
) {
  const worldPath = container.child(dirName);
  await worldPath.mkdir(true);
  const root: NBT = {
    type: 'compound',
    name: '',
    value: { Data: nbt.comp(data) },
  };
  const bytes = await BytesData.fromBuffer(
    gzipSync(nbt.writeUncompressed(root))
  );
  if (isError(bytes)) throw new Error('failed to create level.dat');
  await worldPath.child('level.dat').write(bytes);
}

/** 現行バージョンのシングルプレイで作成されるワールドの level.dat 相当の値 */
function modernLevelDat(overrides: LevelDatTags = {}): LevelDatTags {
  return {
    LevelName: nbt.string('My World'),
    Version: nbt.comp({
      Id: nbt.int(3953),
      Name: nbt.string('1.21'),
      Snapshot: nbt.byte(0),
    }),
    // prismarine-nbt は Long の書き込みに bigint も受け付けるが，型定義が [上位, 下位] の配列のみのためキャストする
    LastPlayed: nbt.long(1739456529104n) as unknown as Tags['long'],
    hardcore: nbt.byte(0),
    GameType: nbt.int(1),
    Difficulty: nbt.byte(3),
    ...overrides,
  };
}

describe('getLocalSaveData', () => {
  beforeEach(async () => {
    await workPath.emptyDir();
  });

  test('シングルプレイのワールド情報を読み込める', async () => {
    await createWorld('world', modernLevelDat());

    const result = await getLocalSaveData(savesPath);

    expect(result.errors).toEqual([]);
    expect(result.value).toHaveLength(1);
    expect(result.value[0]).toMatchObject({
      kind: 'map',
      isFile: false,
      levelName: 'My World',
      versionName: '1.21',
      lastPlayed: 1739456529104,
      gamemode: 'creative',
      difficulty: 'hard',
      hardcore: false,
    });
  });

  test('ハードコアのワールドは hardcore が true になる', async () => {
    await createWorld('hardcore', modernLevelDat({ hardcore: nbt.byte(1) }));

    const result = await getLocalSaveData(savesPath);

    expect(result.value[0]?.hardcore).toBe(true);
  });

  test('hardcore・Difficulty が無い level.dat は通常(非ハードコア・ノーマル)として扱う', async () => {
    const data = modernLevelDat();
    delete data.hardcore;
    delete data.Difficulty;
    await createWorld('noDifficulty', data);

    const result = await getLocalSaveData(savesPath);

    expect(result.value[0]).toMatchObject({
      hardcore: false,
      difficulty: 'normal',
    });
  });

  test('読み込めないワールドが含まれていても他のワールドは読み込める', async () => {
    await createWorld('valid', modernLevelDat());
    // Version タグを持たない古い形式のワールド
    const legacy = modernLevelDat();
    delete legacy.Version;
    await createWorld('legacy', legacy);
    // level.dat を持たないディレクトリ
    await savesPath.child('notWorld').mkdir(true);

    const result = await getLocalSaveData(savesPath);

    expect(result.value.map((w) => w.path)).toEqual([
      savesPath.child('valid').path,
    ]);
    // 読み込めなかったワールドはエラーとして通知される
    expect(result.errors.map((e) => e.arg)).toContainEqual(
      expect.objectContaining({ path: savesPath.child('legacy').path })
    );
  });
});

describe('getAllLocalSaveData', () => {
  const detectedPath = workPath.child('detected', 'saves');
  const additionalPath = workPath.child('additional', 'saves');

  beforeEach(async () => {
    await workPath.emptyDir();
    vi.mocked(getLocalSaveContainers).mockResolvedValue([detectedPath]);
  });

  /** 各保存先にワールドを1つずつ作成し，指定したシステム設定で読み込んだワールドのパスを返す */
  async function loadWith(localSave: z.input<typeof SystemLocalSaveSetting>) {
    await createWorld('detected', modernLevelDat(), detectedPath);
    await createWorld('additional', modernLevelDat(), additionalPath);
    vi.mocked(getSystemSettings).mockResolvedValue(
      SystemSettings.parse({ localSave })
    );

    const result = await getAllLocalSaveData();
    if (isError(result.value)) throw new Error(result.value.key);
    return result.value.map((w) => w.path).sort();
  }

  test('自動検出した保存先とシステム設定で追加した保存先の両方のワールドを読み込む', async () => {
    const paths = await loadWith({
      // 自動検出した保存先と同じフォルダが設定されていても重複して読み込まない
      containers: [
        { path: additionalPath.str() },
        { path: detectedPath.str() },
      ],
    });

    expect(paths).toEqual(
      [
        detectedPath.child('detected').path,
        additionalPath.child('additional').path,
      ].sort()
    );
  });

  test('非表示にした保存先のワールドは読み込まない', async () => {
    const paths = await loadWith({
      containers: [
        { path: additionalPath.str(), visible: false },
        { path: detectedPath.str(), visible: false },
      ],
    });

    expect(paths).toEqual([]);
  });

  test('登録を解除した自動検出の保存先のワールドは読み込まない', async () => {
    const paths = await loadWith({
      containers: [{ path: additionalPath.str() }],
      excluded: [detectedPath.str()],
    });

    expect(paths).toEqual([additionalPath.child('additional').path]);
  });
});
