import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { WorldID } from 'app/src-electron/schema/world';
import { api } from '../core/api';
import { WorldProgressor } from './progress';

/** フロントエンドへ送信されたプログレスの WorldID（送信の順） */
const sentWorldIDs: WorldID[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  sentWorldIDs.length = 0;
  // フロントエンドへの送信（外部との境界）を，送信先の WorldID を記録する偽物にする
  api.send = {
    Progress: (id: WorldID) => {
      sentWorldIDs.push(id);
    },
  } as unknown as typeof api.send;
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

    // 1 回以上送信され，すべての送信が対象のワールドの WorldID を持つ
    expect(sentWorldIDs.length).toBeGreaterThan(0);
    expect(new Set(sentWorldIDs)).toEqual(new Set([worldID]));
  });
});
