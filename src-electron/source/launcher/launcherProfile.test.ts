import { beforeEach, describe, expect, test } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { loadLocalSaveContainers } from './launcherProfile';

const workPath = new Path(__dirname).child('work', 'launcherProfile');
const launcherPath = workPath.child('.minecraft');

/** テスト用の launcher_profiles.json を配置する */
async function writeProfiles(json: object) {
  await launcherPath.child('launcher_profiles.json').writeJson(json);
}

/** 取得結果を比較しやすいよう絶対パスの文字列へ変換する */
function toStrs(paths: Path[]) {
  return paths.map((p) => p.absolute().str()).sort();
}

describe('loadLocalSaveContainers', () => {
  beforeEach(async () => {
    await workPath.emptyDir();
    await launcherPath.mkdir(true);
  });

  test('現行のランチャーが出力する形式(version・項目の欠落を含む)を読み込める', async () => {
    const customGameDir = workPath.child('customGameDir');
    await writeProfiles({
      profiles: {
        // 既定の起動構成は gameDir や javaArgs を持たない
        latest: {
          created: '1970-01-01T00:00:00.000Z',
          icon: 'Grass',
          lastUsed: '2025-01-01T00:00:00.000Z',
          lastVersionId: 'latest-release',
          name: '',
          type: 'latest-release',
        },
        // MOD導入ツールが作成する起動構成は created を持たないことがある
        forge: {
          gameDir: customGameDir.absolute().str(),
          icon: 'Furnace',
          lastUsed: '2025-01-01T00:00:00.000Z',
          lastVersionId: '1.20.1-forge-47.2.0',
          name: 'forge',
          type: 'custom',
        },
      },
      settings: { enableSnapshots: false },
      version: 6,
    });

    const containers = await loadLocalSaveContainers(launcherPath);

    expect(isError(containers)).toBe(false);
    if (isError(containers)) return;
    expect(toStrs(containers)).toEqual(
      toStrs([launcherPath.child('saves'), customGameDir.child('saves')])
    );
  });

  test('同じゲームディレクトリを使う起動構成が複数あっても重複しない', async () => {
    await writeProfiles({
      profiles: {
        a: { name: 'a' },
        b: { name: 'b' },
        c: { name: 'c', gameDir: launcherPath.absolute().str() },
        // 想定外の形式の起動構成は既定のゲームディレクトリとして扱う
        d: { name: 'd', gameDir: 123 },
        e: null,
      },
      version: 3,
    });

    const containers = await loadLocalSaveContainers(launcherPath);

    expect(isError(containers)).toBe(false);
    if (isError(containers)) return;
    expect(toStrs(containers)).toEqual(toStrs([launcherPath.child('saves')]));
  });

  test('launcher_profiles.json が存在しない場合はエラーを返す', async () => {
    const containers = await loadLocalSaveContainers(launcherPath);
    expect(isError(containers)).toBe(true);
  });
});
