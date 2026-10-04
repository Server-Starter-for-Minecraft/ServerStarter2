import { describe, expect, test } from 'vitest';
import { WorldID } from 'app/src-electron/schema/world';
import { ConsoleScrollMemory, ScrollInfo } from './consoleScroll';

const worldA = 'world-a' as WorldID;
const worldB = 'world-b' as WorldID;

/** 内容の高さ1000px・表示領域300pxのコンソールを、指定位置までスクロールした状態 */
const scrolledTo = (position: number): ScrollInfo => ({
  position,
  contentSize: 1000,
  containerSize: 300,
});
const BOTTOM = scrolledTo(700);

describe('ConsoleScrollMemory', () => {
  test('初めて表示するコンソールは最下部を表示し、出力に追従する', () => {
    const memory = new ConsoleScrollMemory();

    expect(memory.restoreTarget(worldA)).toBe('bottom');
    expect(memory.shouldFollowOutput(worldA)).toBe(true);
  });

  test('最下部を表示している間は新しい出力に追従する', () => {
    const memory = new ConsoleScrollMemory();
    memory.record(worldA, BOTTOM);

    expect(memory.shouldFollowOutput(worldA)).toBe(true);
  });

  test('過去の出力を読むためにスクロールした場合は、新しい出力があっても位置を保持する', () => {
    const memory = new ConsoleScrollMemory();
    memory.record(worldA, scrolledTo(200));

    expect(memory.shouldFollowOutput(worldA)).toBe(false);
  });

  test('ワールドを切り替えて戻ってきた場合は、それぞれのワールドのスクロール状態を復元する', () => {
    const memory = new ConsoleScrollMemory();
    memory.record(worldA, scrolledTo(200));
    memory.record(worldB, BOTTOM);

    expect(memory.restoreTarget(worldA)).toBe(200);
    expect(memory.restoreTarget(worldB)).toBe('bottom');
  });

  test('最下部付近までスクロールし直した場合は再び出力に追従する', () => {
    const memory = new ConsoleScrollMemory();
    memory.record(worldA, scrolledTo(200));
    memory.record(worldA, scrolledTo(695));

    expect(memory.shouldFollowOutput(worldA)).toBe(true);
    expect(memory.restoreTarget(worldA)).toBe('bottom');
  });
});
