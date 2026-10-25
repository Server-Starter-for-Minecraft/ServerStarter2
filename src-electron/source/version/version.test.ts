import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Failable } from 'app/src-electron/schema/error';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { VersionType } from '../../schema/version';
import { createFromURLMock, DummyFileRule } from './test/fromURLMock.fixtures';
import { VersionContainer } from './version';

// Mojangの配布APIとJarのダウンロードは，事前に用意されたテスト用ファイルを返す
const originalFromURL = BytesData.fromURL.bind(BytesData);
const urlCreateReadStreamSpy = vi.spyOn(BytesData, 'fromURL');
const dummyFileRules: DummyFileRule[] = [
  { suffix: '.xml', fileName: 'sample.xml' },
  { suffix: '.jar', fileName: 'sample.jar' },
];

describe('listupVersions', { tags: ['network'] }, async () => {
  // 各サーバー種別のバージョン一覧APIには実際にアクセスする(APIの仕様変更の検知を兼ねる)
  beforeEach(() => {
    urlCreateReadStreamSpy.mockImplementation(
      createFromURLMock(dummyFileRules, originalFromURL)
    );
  });

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
      type: 'neoforge',
      vcList: () => vc.listVersions('neoforge', useCache),
      oldestVersion: '25w14craftmine',
    },
    {
      type: 'papermc',
      vcList: () => vc.listVersions('papermc', useCache),
      oldestVersion: '1.7.10',
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
    // 外部サービスにはアクセスしない
    beforeEach(() => {
      urlCreateReadStreamSpy.mockImplementation(
        createFromURLMock(dummyFileRules)
      );
    });

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

    // バージョンの準備に失敗した場合
    test('バージョン準備失敗時はeulaの同意を求めない', async () => {
      // 存在しないバージョンを指定して準備を失敗させる
      const missingVersion = VanillaVersion.parse({
        type: 'vanilla',
        id: 'not-existing-version',
        release: false,
      });
      const failServerPath = workPath.child('failServer');
      const eulaAgree = vi.fn(async () => true);
      const readyResult = await container.readyVersion(
        missingVersion,
        failServerPath,
        async () => {},
        eulaAgree
      );
      // 準備の失敗がそのまま返るはず
      expect(isError(readyResult)).toBe(true);
      // 起動できないサーバーのeulaの同意を求めないはず
      expect(eulaAgree).toHaveBeenCalledTimes(0);
      expect(failServerPath.child('eula.txt').exists()).toBe(false);
    });
  },
  1000 * 60
);
