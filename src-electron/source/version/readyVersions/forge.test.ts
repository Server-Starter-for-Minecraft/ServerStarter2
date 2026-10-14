import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { osPlatform } from 'app/src-electron/util/os/os';
import { ExecRuntime } from './base';
import { ReadyForgeVersion } from './forge';
import {
  expandArgFiles,
  findLaunchJar,
  forgeVersion,
  shimInstallerOutputs,
  writeFiles,
} from './utils/forgeInstaller.fixtures';
import { getVersionJsonObj, getVersionJsonPath } from './utils/versionJson';

// `installer.jar`のダウンロードはネットワークに依存するため，空のファイルを書き出すだけにする
vi.mock('./utils/forgeInstaller', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils/forgeInstaller')>()),
  downloadInstaller: vi.fn(async (_url: string, installFilePath: Path) =>
    installFilePath.writeText('')
  ),
}));

const workPath = new Path(__dirname).child('work', 'forge.test');
const cacheFolder = workPath.child('cache');
const serverPath = workPath.child('server');

const MC_VER = '26.2';
const FORGE_VER = '65.1.3';
const version = forgeVersion(
  MC_VER,
  FORGE_VER,
  `https://maven.minecraftforge.net/net/minecraftforge/forge/${MC_VER}-${FORGE_VER}/forge-${MC_VER}-${FORGE_VER}-installer.jar`
);

/**
 * `installer.jar`の実行を模擬し，指定したファイル群を書き出す
 *
 * @param outputs 書き出すファイル群（既定は現行インストーラと同じ構成）
 */
function mockExecRuntime(
  outputs: Record<string, string> = shimInstallerOutputs(MC_VER, FORGE_VER)
) {
  return vi.fn<ExecRuntime>(async ({ currentDir }) => {
    await writeFiles(currentDir, outputs);
  });
}

/**
 * キャッシュに`version.json`を用意する（バニラの情報の取得にネットワークを使わないため）
 *
 * @param cachePath キャッシュフォルダ
 * @param args 起動引数。省略時はバニラの情報から生成した場合と同じく`-jar ${JAR_PATH}`とする
 */
async function seedVersionJson(cachePath: Path, args?: string[]) {
  const verJson = getVersionJsonObj(
    version.download_url,
    args === undefined,
    undefined,
    undefined,
    args
  );
  await getVersionJsonPath(cachePath).writeText(JSON.stringify(verJson));
}

/** 準備したサーバーを起動したときに`-jar`で指定されるjarのパスを求める */
async function resolveServerLaunchJar(
  ready: Awaited<ReturnType<ReadyForgeVersion['completeReady4VersionFiles']>>
) {
  if (isError(ready)) throw new Error('failed to ready version');
  const args = ready.getCommand({ jvmArgs: [] });
  return findLaunchJar(serverPath, await expandArgFiles(serverPath, args));
}

beforeEach(async () => {
  await workPath.emptyDir();
});

describe('Forgeのサーバーデータの準備', () => {
  test('引数ファイルの書き換えに対応する前に準備された，起動できないキャッシュが残っていても起動できる', async () => {
    // 従来の処理で準備したキャッシュを再現する
    // （shim jarを`version.jar`にリネーム済みだが，引数ファイルは元のjar名を参照したまま）
    const readyOperator = new ReadyForgeVersion(version, cacheFolder);
    const cachePath = readyOperator.cachePath;
    const { [`forge-${MC_VER}-${FORGE_VER}-shim.jar`]: shim, ...outputs } =
      shimInstallerOutputs(MC_VER, FORGE_VER);
    await writeFiles(cachePath, {
      ...outputs,
      'version.jar': shim,
      'version.bat': outputs['run.bat'],
      'version.sh': outputs['run.sh'],
    });
    const argFile =
      osPlatform === 'windows-x64' ? 'win_args.txt' : 'unix_args.txt';
    await seedVersionJson(cachePath, [
      `@libraries/net/minecraftforge/forge/${MC_VER}-${FORGE_VER}/${argFile}`,
    ]);

    const res = await readyOperator.completeReady4VersionFiles(
      serverPath,
      mockExecRuntime()
    );

    expect((await resolveServerLaunchJar(res)).exists()).toBe(true);
  });

  test.each([
    {
      name: '引数ファイルでjarを参照する構成',
      version,
      outputs: shimInstallerOutputs(MC_VER, FORGE_VER),
    },
    {
      name: 'jarのみを生成する構成',
      version: forgeVersion('1.6.4', '9.11.1.1345'),
      outputs: { 'minecraftforge-universal-1.6.4-9.11.1.1345.jar': 'jar' },
    },
  ])(
    '準備済みの正常なキャッシュがある場合は，installer.jarを再実行しない（$name）',
    async ({ version, outputs }) => {
      const readyOperator = new ReadyForgeVersion(version, cacheFolder);
      await seedVersionJson(readyOperator.cachePath);

      const first = mockExecRuntime(outputs);
      await readyOperator.completeReady4VersionFiles(serverPath, first);
      expect(first).toHaveBeenCalled();

      await serverPath.remove();
      const second = mockExecRuntime(outputs);
      const res = await new ReadyForgeVersion(
        version,
        cacheFolder
      ).completeReady4VersionFiles(serverPath, second);

      expect(second).not.toHaveBeenCalled();
      expect((await resolveServerLaunchJar(res)).exists()).toBe(true);
    }
  );
});
