import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test } from 'vitest';
import { WorldID } from 'app/src-electron/schema/world';
import { useProgressStore } from './ProgressStore';

const world1 = 'world-1' as WorldID;
const world2 = 'world-2' as WorldID;
const EULA_URL = 'https://aka.ms/MinecraftEULA';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('EULAへの同意の要求', () => {
  test('回答されるまで、ワールドごとに同意を待っている状態になる', () => {
    const store = useProgressStore();
    store.requestEula(world1, EULA_URL);

    expect(store.waitingEula(world1)).toBe(EULA_URL);
    expect(store.waitingEula(world2)).toBeUndefined();
  });

  test('同意・不同意の回答がバックエンドへの戻り値になり、回答後は待っている状態が解除される', async () => {
    const store = useProgressStore();
    const agreed = store.requestEula(world1, EULA_URL);
    const disagreed = store.requestEula(world2, EULA_URL);

    store.answerEula(world1, true);
    store.answerEula(world2, false);

    await expect(agreed).resolves.toBe(true);
    await expect(disagreed).resolves.toBe(false);
    expect(store.waitingEula(world1)).toBeUndefined();
    expect(store.waitingEula(world2)).toBeUndefined();
  });

  test('他のワールドへの回答は、回答待ちのワールドに影響しない', () => {
    const store = useProgressStore();
    store.requestEula(world1, EULA_URL);

    store.answerEula(world2, true);

    expect(store.waitingEula(world1)).toBe(EULA_URL);
  });
});
