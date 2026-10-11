import { beforeEach, describe, expect, test } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { osPlatform } from 'app/src-electron/util/os/os';
import { loadLocalSaveContainers, uniquePaths } from './launcherProfile';

const workPath = new Path(__dirname).child('work', 'launcherProfile');
const launcherPath = workPath.child('.minecraft');

/** テスト用の起動構成のファイルを配置する */
async function writeProfiles(
  json: object,
  fileName = 'launcher_profiles.json'
) {
  await launcherPath.child(fileName).writeJson(json);
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

    expect(toStrs(containers)).toEqual(toStrs([launcherPath.child('saves')]));
  });

  test('Microsoft Store版のランチャーの起動構成も読み込む', async () => {
    const storeGameDir = workPath.child('storeGameDir');
    await writeProfiles(
      { profiles: { a: { gameDir: storeGameDir.absolute().str() } } },
      'launcher_profiles_microsoft_store.json'
    );

    const containers = await loadLocalSaveContainers(launcherPath);

    expect(toStrs(containers)).toEqual(
      toStrs([launcherPath.child('saves'), storeGameDir.child('saves')])
    );
  });

  test('起動構成のファイルが無い場合は既定の保存先を返す', async () => {
    const containers = await loadLocalSaveContainers(launcherPath);

    expect(toStrs(containers)).toEqual(toStrs([launcherPath.child('saves')]));
  });

  test('起動構成のファイルが壊れている場合は既定の保存先を返す', async () => {
    await launcherPath.child('launcher_profiles.json').writeText('{ broken');

    const containers = await loadLocalSaveContainers(launcherPath);

    expect(toStrs(containers)).toEqual(toStrs([launcherPath.child('saves')]));
  });
});

describe('loadLocalSaveContainers (複数の起動構成ファイル)', () => {
  beforeEach(async () => {
    await workPath.emptyDir();
    await launcherPath.mkdir(true);
  });

  test('両方のランチャーで同じゲームディレクトリを使っていても重複しない', async () => {
    const sharedGameDir = workPath.child('sharedGameDir');
    const json = {
      profiles: { a: { gameDir: sharedGameDir.absolute().str() } },
    };
    await writeProfiles(json);
    await writeProfiles(json, 'launcher_profiles_microsoft_store.json');

    const containers = await loadLocalSaveContainers(launcherPath);

    expect(toStrs(containers)).toEqual(
      toStrs([launcherPath.child('saves'), sharedGameDir.child('saves')])
    );
  });
});

describe('uniquePaths', () => {
  test('同じ場所を指すパスは最初のものだけを残す', () => {
    const a = workPath.child('a');
    const b = workPath.child('b');

    expect(toStrs(uniquePaths([a, b, workPath.child('b', '..', 'a')]))).toEqual(
      toStrs([a, b])
    );
  });

  test.runIf(osPlatform === 'windows-x64')(
    'Windowsでは大文字・小文字だけが異なるパスを同じ場所として扱う',
    () => {
      const path = workPath.child('Saves');
      const lower = new Path(path.absolute().str().toLowerCase());

      expect(uniquePaths([path, lower])).toHaveLength(1);
    }
  );
});
