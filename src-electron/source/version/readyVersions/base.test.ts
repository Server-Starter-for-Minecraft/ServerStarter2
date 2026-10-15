import { describe, expect, test } from 'vitest';
import { Failable } from 'app/src-electron/schema/error';
import { VanillaVersion } from 'app/src-electron/schema/version';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { sleep } from 'app/src-electron/util/promise/sleep';
import { JsonSourceHandler } from 'app/src-electron/util/wrapper/jsonFile';
import { getJarPath, ReadyVersion } from './base';
import { VersionJson } from './utils/versionJson';

/** キャッシュ生成処理の実行状況の記録 */
type GenerationRecord = {
  /** 生成処理が実行された回数 */
  count: number;
  /** 実行中の生成処理の数 */
  running: number;
  /** 同時に実行された生成処理の最大数 */
  maxRunning: number;
};

/**
 * キャッシュの生成に時間がかかるサーバーを模したテスト用の実装
 *
 * 生成処理の実行状況を，コンストラクタで渡された記録に書き込む
 */
class SlowReadyVersion extends ReadyVersion<VanillaVersion> {
  constructor(
    version: VanillaVersion,
    cacheFolder: Path,
    private record: GenerationRecord
  ) {
    super(version, cacheFolder);
  }

  get serverID() {
    return this._version.id;
  }

  protected async generateVersionJson(): Promise<Failable<VersionJson>> {
    return {
      download: { url: 'https://example.com/server.jar' },
      arguments: ['-jar', { embed: 'JAR_PATH' }],
    };
  }

  protected async generateCachedJar(
    _verJsonHandler: JsonSourceHandler<VersionJson>
  ): Promise<Failable<void>> {
    this.record.count++;
    this.record.running++;
    this.record.maxRunning = Math.max(
      this.record.maxRunning,
      this.record.running
    );
    try {
      await sleep(300);
      await getJarPath(this.cachePath).writeText('jar');
    } finally {
      this.record.running--;
    }
  }
}

describe('ReadyVersion', async () => {
  const workPath = new Path(__dirname).child('work', 'base');
  await workPath.emptyDir();
  const cacheFolder = workPath.child('cache');

  test('同じバージョンを同時に準備しても，キャッシュの生成は1度だけ行われる', async () => {
    const version = VanillaVersion.parse({
      type: 'vanilla',
      id: '26.3',
      release: true,
    });
    const serverPaths = [workPath.child('server1'), workPath.child('server2')];
    const record: GenerationRecord = { count: 0, running: 0, maxRunning: 0 };

    // 複数のワールドを同時に起動した状況を再現する
    const results = await Promise.all(
      serverPaths.map((serverPath) =>
        new SlowReadyVersion(
          version,
          cacheFolder,
          record
        ).completeReady4VersionFiles(serverPath, async () => {})
      )
    );

    // どちらの準備も成功し，それぞれにJarが設置されるはず
    for (const res of results) expect(isError(res)).toBe(false);
    for (const serverPath of serverPaths) {
      expect(getJarPath(serverPath).exists()).toBe(true);
    }
    // キャッシュの生成は重ならず，2回目は生成済みのキャッシュを利用するはず
    expect(record.maxRunning).toBe(1);
    expect(record.count).toBe(1);
  });
});
