import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AllVanillaVersion, VersionId } from 'app/src-electron/schema/version';
import { Path } from 'app/src-electron/util/binary/path';
import { fromRuntimeError, isError } from 'app/src-electron/util/error/error';
import { versionContainer } from '../../core/setup';
import { CustomMapData } from '../../schema/filedata';
import { importCustomMap } from './customMap';
import { WorldSettings } from './files/json';

// バージョン一覧はネットワークに依存するため，テストごとに内容を指定する
vi.mock('../../core/setup', () => ({
  versionContainer: { listVersions: vi.fn() },
}));

const workPath = new Path(__dirname).child('work', 'customMap');
const sourcePath = workPath.child('source', 'saves', 'MyWorld');
const serverPath = workPath.child('server');

/** 新規ワールドの既定のバージョン(最新リリース) */
const defaultVersion = {
  type: 'vanilla',
  id: VersionId.parse('26.3'),
  release: true,
} as const;

/** キャッシュ済みのバニラのバージョン一覧 */
const cachedVersions: AllVanillaVersion = [
  { id: VersionId.parse('26.3'), release: true },
  { id: VersionId.parse('25w14a'), release: false },
  { id: VersionId.parse('1.17.1'), release: true },
];

/** 導入するワールドの情報(level.dat から読み込んだ値) */
function customMap(versionName: string): CustomMapData {
  return {
    kind: 'map',
    path: sourcePath.path,
    isFile: false,
    levelName: 'MyWorld',
    versionName,
    lastPlayed: 0,
    gamemode: 'survival',
    hardcore: false,
    difficulty: 'normal',
  };
}

/** 新規ワールドの既定の設定 */
function newWorldSettings(): WorldSettings {
  return WorldSettings.parse({
    memory: { size: 2, unit: 'GB' },
    version: defaultVersion,
  });
}

/**
 * バージョン一覧の取得結果を指定する
 * @param cached キャッシュから取得した場合の一覧
 * @param latest 最新の一覧を取得した場合の一覧
 */
function mockVersions(
  cached: AllVanillaVersion | 'error',
  latest: AllVanillaVersion | 'error' = cached
) {
  const toResult = (v: AllVanillaVersion | 'error') =>
    v === 'error' ? fromRuntimeError(new Error('offline')) : v;
  vi.mocked(versionContainer.listVersions).mockImplementation(
    async (_type, useCache) => toResult(useCache ? cached : latest) as any
  );
}

/** ワールドを導入し，導入後のサーバーのバージョンを返す */
async function importAndGetVersion(versionName: string) {
  const result = await importCustomMap(
    customMap(versionName),
    serverPath,
    newWorldSettings()
  );
  if (isError(result)) throw new Error(`import failed: ${result.key}`);
  return result.settings.version;
}

describe('importCustomMap のサーバーバージョン', () => {
  beforeEach(async () => {
    await workPath.emptyDir();
    await sourcePath.mkdir(true);
    await sourcePath.child('level.dat').writeText('dummy');
  });

  test('ワールドが最後に遊ばれたバージョンのバニラサーバーになる', async () => {
    mockVersions(cachedVersions);

    expect(await importAndGetVersion('1.17.1')).toEqual({
      type: 'vanilla',
      id: '1.17.1',
      release: true,
    });
  });

  test('スナップショットのワールドはスナップショットのサーバーになる', async () => {
    mockVersions(cachedVersions);

    expect(await importAndGetVersion('25w14a')).toEqual({
      type: 'vanilla',
      id: '25w14a',
      release: false,
    });
  });

  test('キャッシュに無いバージョンは最新のバージョン一覧から探す', async () => {
    mockVersions(cachedVersions, [
      { id: VersionId.parse('26.4'), release: true },
      ...cachedVersions,
    ]);

    expect(await importAndGetVersion('26.4')).toEqual({
      type: 'vanilla',
      id: '26.4',
      release: true,
    });
  });

  test('一致するバージョンが無い場合は既定のバージョンのまま', async () => {
    mockVersions(cachedVersions);

    expect(await importAndGetVersion('unknown-version')).toEqual(
      defaultVersion
    );
  });

  test('バージョン一覧を取得できない場合は既定のバージョンのまま', async () => {
    mockVersions('error');

    expect(await importAndGetVersion('1.17.1')).toEqual(defaultVersion);
  });
});
