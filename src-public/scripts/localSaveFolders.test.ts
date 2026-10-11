import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { SystemLocalSaveSetting } from 'app/src-electron/schema/system';
import {
  listLocalSaveFolders,
  localSaveFolderTitle,
  registerLocalSaveFolder,
  setLocalSaveFolderVisible,
  unregisterLocalSaveFolder,
} from './localSaveFolders';

const DETECTED = 'C:/detected/saves';
const ADDED = 'D:/added/saves';

/** 指定した内容のシステム設定を生成する(未指定の項目は既定値) */
function setting(value: z.input<typeof SystemLocalSaveSetting> = {}) {
  return SystemLocalSaveSetting.parse(value);
}

describe('listLocalSaveFolders', () => {
  test('自動検出したフォルダとユーザーが追加したフォルダを区別して並べる', () => {
    const folders = listLocalSaveFolders(
      [DETECTED],
      setting({ containers: [{ path: ADDED }] })
    );

    expect(folders).toEqual([
      { path: DETECTED, visible: true, detected: true },
      { path: ADDED, visible: true, detected: false },
    ]);
  });

  test('自動検出したフォルダの表示設定は設定の値を使い，重複して並べない', () => {
    const folders = listLocalSaveFolders(
      [DETECTED],
      setting({ containers: [{ path: DETECTED, visible: false }] })
    );

    expect(folders).toEqual([
      { path: DETECTED, visible: false, detected: true },
    ]);
  });

  test('登録を解除した自動検出フォルダは並べない', () => {
    expect(
      listLocalSaveFolders([DETECTED], setting({ excluded: [DETECTED] }))
    ).toEqual([]);
  });
});

describe('読み込み先フォルダの操作', () => {
  test('非表示にしたフォルダは一覧上で非表示になり，再表示もできる', () => {
    const s = setting({ containers: [{ path: ADDED }] });

    setLocalSaveFolderVisible(s, { path: DETECTED, detected: true }, false);
    setLocalSaveFolderVisible(s, { path: ADDED, detected: false }, false);
    expect(listLocalSaveFolders([DETECTED], s).map((f) => f.visible)).toEqual([
      false,
      false,
    ]);

    setLocalSaveFolderVisible(s, { path: DETECTED, detected: true }, true);
    expect(listLocalSaveFolders([DETECTED], s)[0].visible).toBe(true);
  });

  test('再表示した自動検出フォルダは，自動検出されなくなると一覧から消える', () => {
    const s = setting();

    setLocalSaveFolderVisible(s, { path: DETECTED, detected: true }, false);
    setLocalSaveFolderVisible(s, { path: DETECTED, detected: true }, true);

    expect(listLocalSaveFolders([], s)).toEqual([]);
  });

  test('自動検出されているフォルダを追加しても重複しない', () => {
    const s = setting();

    registerLocalSaveFolder(s, DETECTED);

    expect(listLocalSaveFolders([DETECTED], s)).toEqual([
      { path: DETECTED, visible: true, detected: true },
    ]);
  });

  test('登録を解除したフォルダは一覧から消え，自動検出フォルダも再び追加できる', () => {
    const s = setting({ containers: [{ path: ADDED }] });

    unregisterLocalSaveFolder(s, { path: DETECTED, detected: true });
    unregisterLocalSaveFolder(s, { path: ADDED, detected: false });
    expect(listLocalSaveFolders([DETECTED], s)).toEqual([]);

    registerLocalSaveFolder(s, DETECTED);
    expect(listLocalSaveFolders([DETECTED], s)).toEqual([
      { path: DETECTED, visible: true, detected: true },
    ]);
  });

  test('追加済みのフォルダを再度追加しても重複せず，表示状態になる', () => {
    const s = setting({ containers: [{ path: ADDED, visible: false }] });

    registerLocalSaveFolder(s, ADDED);

    expect(listLocalSaveFolders([], s)).toEqual([
      { path: ADDED, visible: true, detected: false },
    ]);
  });
});

describe('localSaveFolderTitle', () => {
  test('savesフォルダはゲームディレクトリの名前を表示名とする', () => {
    expect(
      localSaveFolderTitle('C:\\Users\\me\\AppData\\Roaming\\.minecraft\\saves')
    ).toBe('.minecraft');
    expect(localSaveFolderTitle('/home/me/Forge1.20.1/saves/')).toBe(
      'Forge1.20.1'
    );
  });

  test('savesフォルダ以外はフォルダ自身の名前を表示名とする', () => {
    expect(localSaveFolderTitle('D:/worlds')).toBe('worlds');
  });
});
