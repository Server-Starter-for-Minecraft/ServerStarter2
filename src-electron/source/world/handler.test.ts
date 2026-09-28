import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {
  GroupProgressor,
  TitleProgressor,
} from 'app/src-electron/common/progress';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { ServerStartNotification } from 'app/src-electron/schema/server';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { SystemSettings } from 'app/src-electron/schema/system';
import { WorldEdited } from 'app/src-electron/schema/world';
import { Path } from 'app/src-electron/util/binary/path';
import { errorMessage } from 'app/src-electron/util/error/construct';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
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
  /** 起動時にフロントエンドへ通知されるポート番号等の情報 */
  notification: ServerStartNotification;
  /** サーバーがserver.propertiesを読み込んで起動する */
  boot: () => Promise<ServerProperties>;
  /** サーバーを終了する（引数を指定した場合は異常終了） */
  stop: (result?: Failable<undefined>) => void;
  /** サーバーの実行処理が例外で終了する */
  crash: (error: Error) => void;
};

vi.mock('../server/server', () => ({
  runRebootableServer: vi.fn(
    (
      cwdPath: Path,
      _id: unknown,
      _settings: unknown,
      _progress: unknown,
      notification: ServerStartNotification
    ) => {
      let stop: FakeServer['stop'] = () => {};
      let crash: FakeServer['crash'] = () => {};
      const promise = new Promise<Failable<undefined>>((resolve, reject) => {
        stop = (result) => resolve(result);
        crash = (error) => reject(error);
      });
      servers.push({
        notification,
        boot: async () => {
          const props = await serverPropertiesFile.load(cwdPath);
          if (isError(props))
            throw new Error('failed to load server.properties');
          return props;
        },
        stop,
        crash,
      });
      return Object.assign(promise, {
        runCommand: vi.fn(async () => {}),
        reboot: vi.fn(async () => {}),
      });
    }
  ),
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

// 起動準備の途中で例外が発生する状況を再現できるように，実装はそのままでモック化する
vi.mock('./local', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./local')>();
  return {
    ...actual,
    formatWorldDirectory: vi.fn(actual.formatWorldDirectory),
  };
});

const { runNgrok, closeNgrok } = await import('../server/setup/ngrok');
const { formatWorldDirectory } = await import('./local');

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
    version: {
      type: 'vanilla',
      id: '1.20.4',
      release: true,
    } as WorldEdited['version'],
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

/** ワールドのserver.propertiesを読み込む */
async function loadProperties(handler: WorldHandler) {
  const props = await serverPropertiesFile.load(handler.getSavePath());
  if (isError(props)) throw new Error('failed to load server.properties');
  return props;
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

    // Ngrokが転送するポート番号（フロントエンドに通知されるポート番号）で起動している
    const booted = await server.boot();
    expect(runNgrok).toHaveBeenCalledWith(
      NGROK_TOKEN,
      server.notification.port,
      undefined
    );
    expect(booted['server-port']).toBe(server.notification.port);

    server.stop();
    await running;
  });

  test('サーバーがserver.propertiesを読み込む前に保存が行われても，Ngrokが転送するポート番号で起動する', async () => {
    const { handler, world } = await createWorld(true);

    const running = handler.run(new GroupProgressor());
    // サーバーの起動準備中（Jarの準備中など）に保存が行われた状況
    const server = await waitServerLaunched(1);
    await handler.save(world);

    // Ngrokが転送するポート番号（フロントエンドに通知されるポート番号）で起動している
    const booted = await server.boot();
    expect(runNgrok).toHaveBeenCalledWith(
      NGROK_TOKEN,
      server.notification.port,
      undefined
    );
    expect(booted['server-port']).toBe(server.notification.port);

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
    expect(saved.value).toMatchObject({
      properties: { 'server-port': CHANGED_PORT },
    });
    // 実行中に再読み込みした場合もユーザーが設定した値を返す
    const loaded = await handler.load();
    expect(loaded.value).toMatchObject({
      properties: { 'server-port': CHANGED_PORT },
    });

    server.stop();
    const result = await running;

    // 戻り値のワールドとserver.propertiesの両方がユーザーの設定値になっている
    expect(result.value).toMatchObject({
      properties: { 'server-port': CHANGED_PORT },
    });
    expect((await loadProperties(handler))['server-port']).toBe(CHANGED_PORT);
  });

  test('サーバーが異常終了した場合もユーザーが設定したポート番号に戻る', async () => {
    const { handler } = await createWorld(true);

    const running = handler.run(new GroupProgressor());
    const server = await waitServerLaunched(1);

    server.stop(
      errorMessage.system.subprocess({
        processPath: 'java',
        args: [],
        exitcode: 1,
      })
    );
    const result = await running;

    expect(isError(result.value)).toBe(true);
    expect((await loadProperties(handler))['server-port']).toBe(USER_PORT);
  });

  test('Ngrokの起動に失敗した場合はサーバーを起動せず，再度起動できる', async () => {
    const { handler } = await createWorld(true);

    vi.mocked(runNgrok).mockResolvedValueOnce(
      errorMessage.lib.ngrok.unknown({ message: 'failed' })
    );
    const failed = await handler.run(new GroupProgressor());

    expect(isError(failed.value)).toBe(true);
    expect(servers.length).toBe(0);
    expect((await loadProperties(handler))['server-port']).toBe(USER_PORT);

    // 失敗後に改めて起動できる
    const running = handler.run(new GroupProgressor());
    const server = await waitServerLaunched(1);
    server.stop();
    const result = await running;
    expect(isError(result.value)).toBe(false);
  });

  test('Ngrokの起動に失敗し，ポート番号を戻せなかった場合はその失敗も返す', async () => {
    const { handler } = await createWorld(true);

    const ngrokError = errorMessage.lib.ngrok.unknown({ message: 'failed' });
    vi.mocked(runNgrok).mockResolvedValueOnce(ngrokError);
    // ユーザーが設定したポート番号の書き戻しだけが失敗する状況
    const restoreError = errorMessage.system.subprocess({
      processPath: 'restore',
      args: [],
      exitcode: 1,
    });
    const originalSave = serverPropertiesFile.save;
    const saveSpy = vi
      .spyOn(serverPropertiesFile, 'save')
      .mockImplementation(async (path, props) =>
        props['server-port'] === USER_PORT
          ? restoreError
          : originalSave(path, props)
      );

    try {
      const failed = await handler.run(new GroupProgressor());
      // 起動に失敗した原因（Ngrokのエラー）を返しつつ，書き戻しの失敗も伝える
      expect(failed.value).toEqual(ngrokError);
      expect(failed.errors).toContainEqual(restoreError);
    } finally {
      saveSpy.mockRestore();
    }
  });

  test('起動準備の途中で例外が発生した場合も，Ngrokを終了しポート番号を戻して再度起動できる', async () => {
    const { handler } = await createWorld(true);
    vi.mocked(closeNgrok).mockClear();
    // Ngrokの起動後に行われる準備処理のいずれかで例外が発生した状況
    vi.mocked(formatWorldDirectory).mockRejectedValueOnce(
      new Error('unexpected error')
    );

    const failed = await handler.run(new GroupProgressor());

    expect(isError(failed.value)).toBe(true);
    expect(servers.length).toBe(0);
    expect(closeNgrok).toHaveBeenCalledTimes(1);
    expect((await loadProperties(handler))['server-port']).toBe(USER_PORT);

    // 実行中のまま残らず，改めて起動できる
    const running = handler.run(new GroupProgressor());
    const server = await waitServerLaunched(1);
    server.stop();
    expect(isError((await running).value)).toBe(false);
  });

  test('起動準備中の進捗表示で例外が発生しても，サーバーが管理できない状態で起動したまま残らない', async () => {
    const { handler } = await createWorld(true);
    // 起動直前のフロントエンドへの進捗の通知が失敗し続ける状況
    const deleteSpy = vi
      .spyOn(TitleProgressor.prototype, 'delete')
      .mockImplementation(() => {
        throw new Error('failed to send progress');
      });

    try {
      const failed = await handler.run(new GroupProgressor());

      expect(isError(failed.value)).toBe(true);
      expect(servers.length).toBe(0);
      expect((await loadProperties(handler))['server-port']).toBe(USER_PORT);
    } finally {
      deleteSpy.mockRestore();
    }

    // 改めて起動できる
    const running = handler.run(new GroupProgressor());
    const server = await waitServerLaunched(1);
    server.stop();
    expect(isError((await running).value)).toBe(false);
  });

  test('サーバーの実行処理が例外で終了した場合も，ポート番号を戻して再度起動できる', async () => {
    const { handler } = await createWorld(true);

    const running = handler.run(new GroupProgressor());
    const server = await waitServerLaunched(1);
    server.crash(new Error('unexpected error'));

    const result = await running;
    expect(isError(result.value)).toBe(true);
    expect((await loadProperties(handler))['server-port']).toBe(USER_PORT);

    // 実行中のまま残らず，改めて起動できる
    const rerun = handler.run(new GroupProgressor());
    const server2 = await waitServerLaunched(2);
    server2.stop();
    expect(isError((await rerun).value)).toBe(false);
  });

  test('Ngrokの終了に失敗しても，ポート番号を戻して終了する', async () => {
    const { handler } = await createWorld(true);
    vi.mocked(closeNgrok).mockRejectedValueOnce(new Error('failed to close'));

    const running = handler.run(new GroupProgressor());
    const server = await waitServerLaunched(1);
    server.stop();
    const result = await running;

    expect(isError(result.value)).toBe(false);
    expect((await loadProperties(handler))['server-port']).toBe(USER_PORT);
  });
});
