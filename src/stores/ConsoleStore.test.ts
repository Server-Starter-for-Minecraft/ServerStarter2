import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { setI18nFunc } from 'src/i18n/utils/tFunc';
import { runServer, useConsoleStore } from './ConsoleStore';
import { useMainStore } from './MainStore';
import { __getWorldList } from './WorldStore';

const worldID = WorldID.parse('00000000-0000-0000-0000-000000000000');

describe('ConsoleStore サーバーの実行状態', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  /** サーバーを起動してコンソール出力を受け取った状態にする */
  function startRunningServer() {
    const store = useConsoleStore();
    store.initTab(worldID);
    store.initProgress(worldID, 'booting');
    store.startServer(worldID);
    store.setConsole(worldID, '[Server thread/INFO]: Done (1.0s)!', false);
    return store;
  }

  test('起動通知を受け取ると実行中になる', () => {
    const store = useConsoleStore();
    store.initTab(worldID);
    store.initProgress(worldID, 'booting');
    expect(store.status(worldID)).toBe('Ready');

    store.startServer(worldID);
    expect(store.status(worldID)).toBe('Running');
  });

  test('終了通知の後に最後のコンソール出力が届いても，停止処理中の表示のままになる', () => {
    const store = startRunningServer();

    // サーバーの終了通知
    store.initProgress(worldID, 'shutdown');
    // プロセス終了後に遅れて届いた最後の出力
    store.setConsole(
      worldID,
      '[Server thread/INFO]: All dimensions are saved',
      false
    );

    expect(store.status(worldID)).toBe('Ready');
    // 遅れて届いた出力もコンソールには残る
    expect(store.console(worldID).at(-1)?.chunk).toBe(
      '[Server thread/INFO]: All dimensions are saved'
    );
  });
});

describe('runServer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setI18nFunc(
      (key: string) => key,
      () => true
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('サーバーの実行処理が例外で終了しても，停止状態に戻る', async () => {
    const world = {
      id: worldID,
      name: 'world',
      version: { type: 'vanilla', id: '1.20.4', release: true },
    } as unknown as WorldEdited;
    __getWorldList()[worldID] = { type: 'edited', world };
    useMainStore().showWorld(world);
    const store = useConsoleStore();
    store.initTab(worldID);

    vi.stubGlobal('window', {
      API: {
        invokeRunWorld: vi.fn(async () => {
          throw new Error('unexpected error in backend');
        }),
      },
    });

    await expect(runServer()).rejects.toThrow();
    expect(store.status(worldID)).toBe('Stop');
  });
});
