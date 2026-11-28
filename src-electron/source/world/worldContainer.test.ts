import { describe, expect, test } from 'vitest';
import { WorldContainer } from 'app/src-electron/schema/brands';
import { WorldContainerSetting } from 'app/src-electron/schema/system';
import { selectNewWorldContainer } from './worldContainer';

/** テスト用のコンテナ設定を生成する */
function container(name: string, visible: boolean): WorldContainerSetting {
  return { name, visible, container: name as WorldContainer };
}

describe('selectNewWorldContainer', () => {
  test('先頭のコンテナが非表示の場合は表示中のコンテナに新規ワールドを作成する', () => {
    const hidden = container('default', false);
    const visible = container('custom', true);

    expect(selectNewWorldContainer([hidden, visible])).toEqual(visible);
  });

  test('表示中のコンテナが複数ある場合は登録順で先頭のものを選ぶ', () => {
    const first = container('default', true);
    const second = container('custom', true);

    expect(selectNewWorldContainer([first, second])).toEqual(first);
  });

  test('全てのコンテナが非表示の場合は先頭のコンテナを選ぶ', () => {
    const first = container('default', false);
    const second = container('custom', false);

    expect(selectNewWorldContainer([first, second])).toEqual(first);
  });

  test('コンテナが登録されていない場合はundefinedを返す', () => {
    expect(selectNewWorldContainer([])).toBeUndefined();
  });
});
