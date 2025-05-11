import { describe, expect, test, vi } from 'vitest';
import { Failable } from 'app/src-electron/schema/error';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { VersionType } from '../../schema/version';
import { VersionContainer } from './version';

// 実際にはUrlにアクセスせず、事前に用意されたテスト用ファイルを返す
const urlCreateReadStreamSpy = vi.spyOn(BytesData, 'fromURL');
urlCreateReadStreamSpy.mockImplementation(async (url: string) => {
  const dummyAssets = new Path(__dirname).child('test');
  const verManifestURL =
    'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';
  if (url === verManifestURL) {
    return BytesData.fromPath(dummyAssets.child('version_manifest_v2.json'));
  } else if (url.endsWith('.xml')) {
    return BytesData.fromPath(dummyAssets.child('sample.xml'));
  } else if (url.endsWith('.jar')) {
    return BytesData.fromPath(dummyAssets.child('sample.jar'));
  }

  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return BytesData.fromBuffer(Buffer.from(buffer));
});

describe('listupVersions', async () => {
  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child('getVersions/work/versions');
  await workPath.emptyDir();

  const vc = new VersionContainer(workPath);

  // キャッシュの威力を確認するときにはTrueにする
  const useCache = true;

  type TestCase = {
    type: VersionType;
    vcList: () => Promise<Failable<any>>;
    oldestVersion: string;
  };
  const testCases: TestCase[] = [
    {
      type: 'vanilla',
      vcList: () => vc.listVersions('vanilla', useCache),
      oldestVersion: '1.3',
    },
    {
      type: 'forge',
      vcList: () => vc.listVersions('forge', useCache),
      oldestVersion: '1.5.2',
    },
    {
      type: 'papermc',
      vcList: () => vc.listVersions('papermc', useCache),
      oldestVersion: '1.8.8',
    },
    {
      type: 'mohistmc',
      vcList: () => vc.listVersions('mohistmc', useCache),
      oldestVersion: '1.7.10',
    },
    {
      type: 'fabric',
      vcList: () => vc.listVersions('fabric', useCache),
      oldestVersion: '18w43b',
    },
    {
      type: 'spigot',
      vcList: () => vc.listVersions('spigot', useCache),
      oldestVersion: '1.8',
    },
  ];

  test.each(testCases)(
    'versionList ($type)',
    { timeout: 1000 * 60 },
    async (tCase) => {
      const getCachedList = await tCase.vcList(); // 取得に成功したか
      expect(isError(getCachedList)).toEqual(false);
      if (isError(getCachedList)) return;

      // 取得した内容が正しいか（バニラの最も古いバージョンは「1.3」）
      const cachedList = getCachedList;
      if ('games' in cachedList) {
        // fabricのみ特別対応
        expect(cachedList.games[cachedList.games.length - 1].id).toEqual(
          tCase.oldestVersion
        );
      } else {
        // その他のサーバー
        expect(cachedList[cachedList.length - 1].id).toEqual(
          tCase.oldestVersion
        );
      }
    }
  );
});

describe(
  'eula生成テスト',
  async () => {
    const { VanillaVersion } = await import('../../schema/version');

    const workPath = new Path(__dirname).child('work', 'version');
    await workPath.remove();
    const container = new VersionContainer(workPath.child('cache'));

    const vanilla = VanillaVersion.parse({
      type: 'vanilla',
      id: '1.12.1',
      release: false,
    });

    const serverPath = workPath.child('server');

    // 1回目 (eula=false)
    test('1回目 (eula=false)', async () => {
      const eulaDisagree = vi.fn(async () => false);
      const readyResult = await container.readyVersion(
        vanilla,
        serverPath,
        async () => {},
        eulaDisagree
      );
      // eulaの同意を求める関数が実行されるはず
      expect(eulaDisagree).toHaveBeenCalledTimes(1);
      // eula.txtが "eula=false" であるはず
      expect(await serverPath.child('eula.txt').readText()).toBe('eula=false');
      // readyResultが失敗するはず
      expect(isError(readyResult)).toBe(true);

      // 撤収
      await container.removeVersion(vanilla, serverPath);
      expect(serverPath.child('eula.txt').exists()).toBe(false);
    });

    // 2回目 (eula=true)
    test('2回目 (eula=true)', async () => {
      const eulaAgree = vi.fn(async () => true);
      const readyResult = await container.readyVersion(
        vanilla,
        serverPath,
        async () => {},
        eulaAgree
      );
      // eulaの同意を求める関数が実行されるはず
      expect(eulaAgree).toHaveBeenCalledTimes(1);
      // eula.txtが "eula=true" であるはず
      expect(await serverPath.child('eula.txt').readText()).toBe('eula=true');
      // readyResultが成功するはず
      expect(isError(readyResult)).toBe(false);

      // 撤収
      await container.removeVersion(vanilla, serverPath);
      expect(serverPath.child('eula.txt').exists()).toBe(false);
    });

    // 3回目 (eula=true)
    test('3回目 (eula=true)', async () => {
      const eulaAgree = vi.fn(async () => true);
      const readyResult = await container.readyVersion(
        vanilla,
        serverPath,
        async () => {},
        eulaAgree
      );
      // eulaの同意を求める関数は既に同意済みなので実行されないはず
      expect(eulaAgree).toHaveBeenCalledTimes(0);
      // eula.txtが "eula=true" であるはず
      expect(await serverPath.child('eula.txt').readText()).toBe('eula=true');
      // readyResultが成功するはず
      expect(isError(readyResult)).toBe(false);

      // 撤収
      await container.removeVersion(vanilla, serverPath);
      expect(serverPath.child('eula.txt').exists()).toBe(false);
    });
  },
  1000 * 60
);
