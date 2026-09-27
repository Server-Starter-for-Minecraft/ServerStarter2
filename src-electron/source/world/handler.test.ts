import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { GroupProgressor } from 'app/src-electron/common/progress';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { SystemSettings } from 'app/src-electron/schema/system';
import { WorldEdited } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { getCurrentTimestamp } from 'app/src-electron/util/timestamp';
import { serverPropertiesFile } from './files/properties';
import { WorldHandler } from './handler';

const NGROK_TOKEN = 'dummy-token';

/** 起動したサーバー（疑似）の一覧 */
const servers: FakeServer[] = [];

/**
 * 実際のサーバーは起動準備（Jarの準備やEulaへの同意など）が済んでからserver.propertiesを読み込むため，
 * 読み込むタイミング（boot）と終了するタイミング（stop）をテストから制御できる疑似サーバー
 */
type FakeServer = {
  /** サーバーがserver.propertiesを読み込んで起動する */
  boot: () => Promise<ServerProperties>;
  /** サーバーを終了する */
  stop: () => void;
};

vi.mock('../server/server', () => ({
  runRebootableServer: vi.fn((cwdPath: Path) => {
    let stop: () => void = () => {};
    const promise = new Promise<undefined>((resolve) => {
      stop = () => resolve(undefined);
    });
    servers.push({
      boot: async () => {
        const props = await serverPropertiesFile.load(cwdPath);
        if (isError(props)) throw new Error('failed to load server.properties');
        return props;
      },
      stop,
    });
    return Object.assign(promise, {
      runCommand: vi.fn(async () => {}),
      reboot: vi.fn(async () => {}),
    });
  }),
}));

vi.mock('../server/setup/ngrok', () => ({
  runNgrok: vi.fn(async (_token: string, port: number) => ({
    url: () => `tcp://0.tcp.jp.ngrok.io:${port}`,
  })),
  closeNgrok: vi.fn(async () => {}),
}));

vi.mock('../stores/system', () => ({
  getSystemSettings: vi.fn(async () => {
    const settings = SystemSettings.parse({ container: [] });
    settings.user.ngrokToken = NGROK_TOKEN;
    return settings;
  }),
}));

const { runNgrok } = await import('../server/setup/ngrok');

const workPath = new Path(__dirname).child('work', 'handler');
const container = WorldContainer.parse(workPath.absolute().path);
let worldIdx = 0;

/** ユーザーが設定したポート番号 */
const USER_PORT = 25570;

/** テスト用のワールドを作成する */
async function createWorld(useNgrok: boolean) {
  const name = WorldName.parse(`world${worldIdx++}`);
  const id = WorldHandler.register(name, container);
  const handler = WorldHandler.get(id);
  if (isError(handler)) throw new Error('failed to register world');

  const world: WorldEdited = {
    name,
    container,
    id,
    version: { type: 'vanilla', id: '1.20.4', release: true } as WorldEdited['version'],
    using: false,
    remote: undefined,
    last_date: getCurrentTimestamp(true),
    last_user: undefined,
    memory: { size: 2, unit: 'GB' },
    javaArguments: undefined,
    properties: ServerProperties.parse({
      'server-port': USER_PORT.toString(),
      'query.port': USER_PORT.toString(),
    }),
    players: [],
    additional: { datapacks: [], plugins: [], mods: [] },
    ngrok_setting: { use_ngrok: useNgrok },
  };
  const created = await handler.create(world);
  if (isError(created.value)) throw new Error('failed to create world');

  return { handler, world };
}

/** 疑似サーバーが起動されるまで待機する */
async function waitServerLaunched(count: number) {
  await vi.waitFor(() => expect(servers.length).toBe(count), {
    timeout: 5000,
  });
  return servers[count - 1];
}

/** server.propertiesのポート番号をユーザーの設定値として変更したワールドを返す */
function changeUserPort(world: WorldEdited, port: number): WorldEdited {
  if (isError(world.properties)) throw new Error('invalid properties');
  return {
    ...world,
    properties: { ...world.properties, 'server-port': port },
  };
}

describe('WorldHandler サーバー起動時のポート番号', () => {
  beforeAll(async () => {
    await workPath.emptyDir();
  });
  beforeEach(() => {
    servers.length = 0;
    vi.mocked(runNgrok).mockClear();
  });
  afterEach(() => {
    // テストが失敗した場合でも実行中の疑似サーバーを終了させる
    servers.forEach((s) => s.stop());
  });

  test('Ngrokを利用しない場合はユーザーが設定したポート番号で起動する', async () => {
    const { handler } = await createWorld(false);

    const running = handler.run(new GroupProgressor());
    const server = await waitServerLaunched(1);

    const booted = await server.boot();
    expect(booted['server-port']).toBe(USER_PORT);
    expect(runNgrok).not.toHaveBeenCalled();

    server.stop();
    const result = await running;
    expect(isError(result.value)).toBe(false);
  });

  test('Ngrok利用時は起動直後に保存が行われても，Ngrokが転送するポート番号で起動する', async () => {
    const { handler, world } = await createWorld(true);

    // 起動ボタンを押した直後にフロントエンドから保存が要求された状況
    const running = handler.run(new GroupProgressor());
    const saving = handler.save(world);

    const server = await waitServerLaunched(1);
    await saving;

    const booted = await server.boot();
    const ngrokPort = vi.mocked(runNgrok).mock.calls[0][1];
    expect(booted['server-port']).toBe(ngrokPort);

    server.stop();
    await running;
  });

  test('サーバーがserver.propertiesを読み込む前に保存が行われても，Ngrokが転送するポート番号で起動する', async () => {
    const { handler, world } = await createWorld(true);

    const running = handler.run(new GroupProgressor());
    // サーバーの起動準備中（Jarの準備中など）に保存が行われた状況
    const server = await waitServerLaunched(1);
    await handler.save(world);

    const booted = await server.boot();
    const ngrokPort = vi.mocked(runNgrok).mock.calls[0][1];
    expect(booted['server-port']).toBe(ngrokPort);

    server.stop();
    await running;
  });

  test('サーバー終了後はユーザーが設定したポート番号に戻り，実行中に変更した値も反映される', async () => {
    const { handler, world } = await createWorld(true);

    const running = handler.run(new GroupProgressor());
    const server = await waitServerLaunched(1);

    // 実行中にユーザーがポート番号を変更
    const CHANGED_PORT = 25580;
    const saved = await handler.save(changeUserPort(world, CHANGED_PORT));
    // フロントエンドにはユーザーが設定した値を返す
    expect(isError(saved.value)).toBe(false);
    if (!isError(saved.value) && !isError(saved.value.properties)) {
      expect(saved.value.properties['server-port']).toBe(CHANGED_PORT);
    }

    server.stop();
    const result = await running;

    // 戻り値のワールドとserver.propertiesの両方がユーザーの設定値になっている
    expect(isError(result.value)).toBe(false);
    if (!isError(result.value) && !isError(result.value.properties)) {
      expect(result.value.properties['server-port']).toBe(CHANGED_PORT);
    }
    const props = await serverPropertiesFile.load(handler.getSavePath());
    expect(isError(props)).toBe(false);
    if (!isError(props)) {
      expect(props['server-port']).toBe(CHANGED_PORT);
    }
  });
});
