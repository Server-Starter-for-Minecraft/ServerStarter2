import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test } from 'vitest';
import { WorldID } from 'app/src-electron/schema/world';
import { useWorldRequestStore } from './WorldRequestStore';

const world1 = 'world-1' as WorldID;
const world2 = 'world-2' as WorldID;
const eula = { url: 'https://aka.ms/MinecraftEULA' };

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('ワールドごとのユーザーへの要求（EULAへの同意）', () => {
  test('回答されるまで、ワールドごとに回答待ちの状態になる', () => {
    const store = useWorldRequestStore();
    store.request(world1, 'eula', eula);

    expect(store.pending(world1)).toEqual({ kind: 'eula', payload: eula });
    expect(store.pending(world2)).toBeUndefined();
  });

  test('同意・不同意の回答がバックエンドへの戻り値になり、回答後は回答待ちが解除される', async () => {
    const store = useWorldRequestStore();
    const agreed = store.request(world1, 'eula', eula);
    const disagreed = store.request(world2, 'eula', eula);

    store.answer(world1, 'eula', true);
    store.answer(world2, 'eula', false);

    await expect(agreed).resolves.toBe(true);
    await expect(disagreed).resolves.toBe(false);
    expect(store.pending(world1)).toBeUndefined();
    expect(store.pending(world2)).toBeUndefined();
  });

  test('他のワールドへの回答は、回答待ちのワールドに影響しない', () => {
    const store = useWorldRequestStore();
    store.request(world1, 'eula', eula);

    store.answer(world2, 'eula', true);

    expect(store.pending(world1)).toBeDefined();
  });

  test('同じワールドに再度要求された場合は、以前の要求を不同意として終わらせ、バックエンドが待ち続けないようにする', async () => {
    const store = useWorldRequestStore();
    const first = store.request(world1, 'eula', eula);
    const second = store.request(world1, 'eula', eula);

    await expect(first).resolves.toBe(false);
    store.answer(world1, 'eula', true);
    await expect(second).resolves.toBe(true);
  });
});
