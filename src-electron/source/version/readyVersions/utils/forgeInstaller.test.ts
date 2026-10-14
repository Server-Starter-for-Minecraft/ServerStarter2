import { beforeEach, describe, expect, test } from 'vitest';
import { ForgeVersion, NeoForgeVersion } from 'app/src-electron/schema/version';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { getJarPath } from '../base';
import { getNewForgeArgs } from './forgeArgAnalyzer';
import {
  hasMissingJarReference,
  renameFilesFromInstaller,
} from './forgeInstaller';
import {
  expandArgFiles,
  findLaunchJar,
  forgeVersion,
  MODULE_ARGS,
  neoForgeVersion,
  scriptInstallerOutputs,
  shimInstallerOutputs,
  writeFiles,
} from './forgeInstaller.fixtures';
import { getVersionJsonObj, replaceEmbedArgs } from './versionJson';

const workPath = new Path(__dirname).child('work', 'forgeInstaller');

/** 準備後のファイル群から，サーバー起動時にJavaへ渡される引数（引数ファイルは展開済み）を求める */
async function resolveLaunchArgs(
  cwd: Path,
  version: ForgeVersion | NeoForgeVersion
) {
  const verJson = await getNewForgeArgs(
    cwd,
    version,
    getVersionJsonObj('', true)
  );
  if (isError(verJson)) throw new Error('failed to analyze args');

  const args = replaceEmbedArgs(verJson.arguments, {
    JAR_PATH: [getJarPath(cwd).basename()],
    JVM_ARGUMENT: [],
    LOG4J_ARG: [],
  });
  return expandArgFiles(cwd, args);
}

/** フォルダ直下に置かれたjarのファイル名一覧 */
async function listJars(cwd: Path) {
  const files = await cwd.iter();
  if (isError(files)) throw new Error('failed to list files');
  return files.map((f) => f.basename()).filter((f) => f.endsWith('.jar'));
}

beforeEach(async () => {
  await workPath.emptyDir();
});

describe('installer.jarが書き出したファイルの整理', () => {
  test.each([
    ['1.20.4', '49.2.0'],
    ['26.2', '65.1.3'],
  ])(
    '引数ファイルでjarを参照するバージョン（%s-%s）では，起動時に指定されるjarが存在する',
    async (mcVer, forgeVer) => {
      const version = forgeVersion(mcVer, forgeVer);
      await writeFiles(workPath, shimInstallerOutputs(mcVer, forgeVer));

      const res = await renameFilesFromInstaller(workPath, version);
      expect(isError(res)).toBe(false);

      const launchArgs = await resolveLaunchArgs(workPath, version);
      expect(findLaunchJar(workPath, launchArgs).exists()).toBe(true);
    }
  );

  test('引数ファイルでjarを参照するバージョンでも，同じ内容のjarを複数置かない', async () => {
    const version = forgeVersion('26.2', '65.1.3');
    await writeFiles(workPath, shimInstallerOutputs('26.2', '65.1.3'));

    await renameFilesFromInstaller(workPath, version);

    expect(await listJars(workPath)).toEqual([getJarPath(workPath).basename()]);
  });

  test.each([
    {
      name: 'Forge 1.20.1',
      version: forgeVersion('1.20.1', '47.4.0'),
      argsDir: 'libraries/net/minecraftforge/forge/1.20.1-47.4.0',
    },
    {
      name: 'NeoForge',
      version: neoForgeVersion('1.21.1', '21.1.200'),
      argsDir: 'libraries/net/neoforged/neoforge/21.1.200',
    },
  ])(
    'jarを直接起動しないバージョン（$name）では，引数ファイルの内容がそのまま起動時に渡される',
    async ({ version, argsDir }) => {
      await writeFiles(workPath, scriptInstallerOutputs(argsDir, MODULE_ARGS));

      const res = await renameFilesFromInstaller(workPath, version);
      expect(isError(res)).toBe(false);

      const launchArgs = await resolveLaunchArgs(workPath, version);
      const expectedArgs = MODULE_ARGS.split(/\s+/).filter((s) => s !== '');
      expect(launchArgs).toEqual(expect.arrayContaining(expectedArgs));
    }
  );

  test('起動スクリプトが生成されないバージョンでは，生成されたjarがサーバーJarとして起動される', async () => {
    const version = forgeVersion('1.12.2', '14.23.5.2860');
    const jar = 'forge-1.12.2-14.23.5.2860.jar';
    await writeFiles(workPath, { [jar]: jar });

    await renameFilesFromInstaller(workPath, version);

    const launchArgs = await resolveLaunchArgs(workPath, version);
    expect(await findLaunchJar(workPath, launchArgs).readText()).toBe(jar);
  });
});

describe('起動できないキャッシュの検出', () => {
  test('引数ファイルが存在しない生成jarを参照している場合は検出する', async () => {
    const version = forgeVersion('26.2', '65.1.3');
    const { 'forge-26.2-65.1.3-shim.jar': _shim, ...outputs } =
      shimInstallerOutputs('26.2', '65.1.3');
    await writeFiles(workPath, {
      ...outputs,
      'version.bat': outputs['run.bat'],
      'version.sh': outputs['run.sh'],
    });

    expect(await hasMissingJarReference(workPath, version)).toBe(true);
  });

  test('モジュールパスの一部に生成jarと似た名前が含まれていても，正常に準備したキャッシュは検出しない', async () => {
    const version = forgeVersion('1.20.1', '47.4.0');
    const argsDir = 'libraries/net/minecraftforge/forge/1.20.1-47.4.0';
    await writeFiles(
      workPath,
      scriptInstallerOutputs(
        argsDir,
        `-p libraries/a.jar;${argsDir}/forge-1.20.1-47.4.0-universal.jar
${MODULE_ARGS}`
      )
    );

    await renameFilesFromInstaller(workPath, version);

    expect(await hasMissingJarReference(workPath, version)).toBe(false);
  });
});
