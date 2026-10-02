import type { WorldList } from 'app/src/stores/WorldStore';
import { describe, expect, test } from 'vitest';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import { WorldAbbr, WorldID } from 'app/src-electron/schema/world';
import { nextWorldAfterDeletion } from './worldDeletion';

const defaultFolder = 'servers' as WorldContainer;
const customFolder = 'custom' as WorldContainer;

/** テスト用のワールドフォルダ設定を生成する */
function folders(visible: Record<string, boolean>): WorldContainerSetting[] {
  return Object.entries(visible).map(([container, v]) => ({
    container: container as WorldContainer,
    visible: v,
    name: container,
  }));
}

/** テスト用のワールド一覧を生成する（引数の順に登録） */
function worldList(...worlds: [id: string, container: WorldContainer][]) {
  const list: WorldList = {};
  for (const [id, container] of worlds) {
    const world: WorldAbbr = {
      id: id as WorldID,
      name: id as WorldName,
      container,
    };
    list[world.id] = { type: 'abbr', world };
  }
  return list;
}

describe('nextWorldAfterDeletion', () => {
  test('削除したワールド以外の表示中のワールドを表示する', () => {
    const worlds = worldList(['w1', defaultFolder], ['w2', defaultFolder]);
    const containers = folders({ [defaultFolder]: true });

    expect(nextWorldAfterDeletion(worlds, containers, 'w1' as WorldID)).toBe(
      'w2'
    );
  });

  test('非表示のワールドフォルダのワールドは削除後の表示先に選ばない', () => {
    // 既定のフォルダを非表示にし、別のフォルダのワールドのみが表示されている状態
    const worlds = worldList(
      ['hidden', defaultFolder],
      ['shown', customFolder]
    );
    const containers = folders({
      [defaultFolder]: false,
      [customFolder]: true,
    });

    // 表示中の唯一のワールドを削除した場合は、表示できるワールドが残らない
    expect(
      nextWorldAfterDeletion(worlds, containers, 'shown' as WorldID)
    ).toBeUndefined();
  });

  test('表示中のワールドが残る場合は非表示のワールドより優先して表示する', () => {
    const worlds = worldList(
      ['hidden', defaultFolder],
      ['shown1', customFolder],
      ['shown2', customFolder]
    );
    const containers = folders({
      [defaultFolder]: false,
      [customFolder]: true,
    });

    expect(
      nextWorldAfterDeletion(worlds, containers, 'shown1' as WorldID)
    ).toBe('shown2');
  });
});
