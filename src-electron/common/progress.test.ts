import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { WorldID } from 'app/src-electron/schema/world';
import { api } from '../core/api';
import { WorldProgressor } from './progress';

const sendProgress = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  sendProgress.mockClear();
  api.send = { Progress: sendProgress } as unknown as typeof api.send;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('WorldProgressor', () => {
  test('フロントエンドに送信されるプログレスには常に対象のWorldIDが付与される', () => {
    const worldID = 'test-world' as WorldID;

    const progressor = new WorldProgressor(worldID);
    progressor.title({ key: 'server.readyJava.title' });
    vi.runAllTimers();

    expect(sendProgress).toHaveBeenCalled();
    for (const [sentID] of sendProgress.mock.calls) {
      expect(sentID).toBe(worldID);
    }
  });
});
