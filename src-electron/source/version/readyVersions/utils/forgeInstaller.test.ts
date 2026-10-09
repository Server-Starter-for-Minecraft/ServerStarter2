import { beforeEach, describe, expect, test } from 'vitest';
import { ForgeVersion, VersionId } from 'app/src-electron/schema/version';
import { Path } from 'app/src-electron/util/binary/path';
import { getJarPath } from '../base';
import { renameFilesFromInstaller } from './forgeInstaller';

const workPath = new Path(__dirname).child('work', 'forgeInstaller');

/** テスト用のForgeのバージョン（ファイル名の判定には型のみが使われる） */
function forgeVersion(id: string, forgeVersion: string): ForgeVersion {
  return {
    type: 'forge',
    id: id as VersionId,
    forge_version: forgeVersion,
    download_url: '',
  };
}

/** installer.jarが書き出したファイル群を模擬的に用意する */
async function writeInstallerOutputs(files: string[]) {
  await Promise.all(files.map((f) => workPath.child(f).writeText(f)));
}

beforeEach(async () => {
  await workPath.emptyDir();
});

describe('installer.jarが書き出したファイルの整理', () => {
  test('起動スクリプトが生成されるバージョンでは，引数ファイルが参照するjarを元の名前のまま残す', async () => {
    // Forge 26.2 などは`win_args.txt`内で`-jar forge-***-shim.jar`を参照する
    const shim = 'forge-26.2-65.1.3-shim.jar';
    await writeInstallerOutputs([shim, 'run.bat', 'run.sh']);

    await renameFilesFromInstaller(workPath, forgeVersion('26.2', '65.1.3'));

    expect(workPath.child(shim).exists()).toBe(true);
    expect(getJarPath(workPath).exists()).toBe(true);
  });

  test('起動スクリプトが生成されないバージョンでは，生成されたjarをサーバーJarとして配置する', async () => {
    const jar = 'forge-1.12.2-14.23.5.2860.jar';
    await writeInstallerOutputs([jar]);

    await renameFilesFromInstaller(
      workPath,
      forgeVersion('1.12.2', '14.23.5.2860')
    );

    expect(await getJarPath(workPath).readText()).toBe(jar);
  });
});
