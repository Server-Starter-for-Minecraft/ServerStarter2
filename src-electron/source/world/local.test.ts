import { beforeEach, describe, expect, test } from 'vitest';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { WorldID } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { loadLocalFiles, saveLocalFiles } from './local';

const workPath = new Path(__dirname).child('work', 'local');
const id = 'local-test-world' as WorldID;
const name = 'LocalTestWorld' as WorldName;
const container = workPath.path as WorldContainer;
const JAVA_ARGUMENTS = '-Dss.test="a b" -XX:+UseG1GC';

beforeEach(async () => {
  await workPath.emptyDir();
  // server.propertiesが無い場合はシステム設定（electronに依存）から既定値を読み込むため，用意しておく
  await workPath.child('server.properties').writeText('server-port=25565\n');
  await workPath.child('server_settings.json').writeText(
    JSON.stringify({
      memory: { size: 2, unit: 'GB' },
      javaArguments: JAVA_ARGUMENTS,
      version: { type: 'vanilla', id: '1.21.4', release: true },
      using: false,
    })
  );
});

/** ワールドを読み込む（読み込めなかった場合はテストを失敗させる） */
async function load() {
  const world = (await loadLocalFiles(workPath, id, name, container)).value;
  if (isError(world)) throw new Error(`failed to load world: ${world.key}`);
  return world;
}

describe('ワールド固有のJavaの実行時引数', () => {
  test('server_settings.jsonに記載された値がワールドの設定として読み込まれる', async () => {
    expect((await load()).javaArguments).toBe(JAVA_ARGUMENTS);
  });

  test('ワールドを保存し直しても値が失われない', async () => {
    const world = await load();
    await saveLocalFiles(workPath, {
      ...world,
      additional: { datapacks: [], plugins: [], mods: [] },
    });

    expect((await load()).javaArguments).toBe(JAVA_ARGUMENTS);
  });
});
