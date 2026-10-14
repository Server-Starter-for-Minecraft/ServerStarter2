import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test } from 'vitest';
import { GroupProgress } from 'app/src-electron/schema/progress';
import { WorldID } from 'app/src-electron/schema/world';
import { useProgressStore } from './ProgressStore';

const world1 = 'world-1' as WorldID;
const world2 = 'world-2' as WorldID;

/** ワールドの読み込み中であることを示すプログレス */
const loadingProgress: GroupProgress = {
  type: 'group',
  value: [{ type: 'title', value: { key: 'server.load.title' } }],
};

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('ワールドごとのプログレス', () => {
  test('初期化したワールドに届いたプログレスが，タイトルとともに記録される', () => {
    const store = useProgressStore();
    store.initProgress(world1, 'booting');

    store.setProgress(world1, loadingProgress);

    expect(store.getProgress(world1)).toEqual({
      title: 'booting',
      progress: loadingProgress,
    });
  });

  test('初期化前のワールドにプログレスが届いても例外にならず，プログレスが記録される', () => {
    const store = useProgressStore();

    expect(() => store.setProgress(world1, loadingProgress)).not.toThrow();
    expect(store.getProgress(world1)?.progress).toEqual(loadingProgress);
  });

  test('あるワールドのプログレスは，他のワールドに影響しない', () => {
    const store = useProgressStore();
    store.initProgress(world1, 'booting');
    store.initProgress(world2, 'shutdown');

    store.setProgress(world1, loadingProgress);

    expect(store.getProgress(world2)).toEqual({
      title: 'shutdown',
      progress: {},
    });
  });
});
