import { isNgrokEnabled } from 'app/src-electron/schema/ngrok';
import { serverPortPropertyKeys } from 'app/src-electron/schema/serverproperty';
import { WorldEdited } from 'app/src-electron/schema/world';

/**
 * プロパティが編集不可である理由
 *
 * 理由を追加する場合は，i18nの`property.locked`に同名のキーで説明文を追加する
 */
export type LockReason = 'ngrok';

/**
 * 編集不可なプロパティの一覧
 *
 * キーはプロパティ名，値は編集不可である理由
 */
export type LockedProperties = Partial<Record<string, LockReason>>;

/**
 * ワールドの設定によって編集できない（設定しても使われない）プロパティを返す
 *
 * 新たに編集不可となる条件を追加する場合は，この関数に条件と理由を追加する
 *
 * @param world 対象のワールド
 * @param ngrokToken システム設定に登録されたNgrokのトークン（未登録の場合はNgrokを利用しない）
 * @returns 編集不可なプロパティと，その理由
 */
export function getLockedProperties(
  world: Pick<WorldEdited, 'ngrok_setting'>,
  ngrokToken: string | undefined
): LockedProperties {
  const locked: LockedProperties = {};

  // ポート開放不要化（Ngrok）の利用時はポート番号が自動で割り当てられるため，ユーザーの設定値は使われない
  if (isNgrokEnabled(world, ngrokToken)) {
    serverPortPropertyKeys.forEach((key) => (locked[key] = 'ngrok'));
  }

  return locked;
}

/** In Source Testing */
if (import.meta.vitest) {
  const { describe, test, expect } = import.meta.vitest;

  describe('getLockedProperties', () => {
    const portKeys = ['server-port', 'query.port'];

    test('Ngrokを利用する場合はポート番号のプロパティが編集不可になる', () => {
      const locked = getLockedProperties(
        { ngrok_setting: { use_ngrok: true } },
        'token'
      );
      portKeys.forEach((key) => expect(locked[key]).toBeDefined());
    });

    test.each([
      ['ワールドでNgrokを利用しない', false, 'token'],
      ['Ngrokのトークンが未登録', true, undefined],
      ['Ngrokのトークンが空文字', true, ''],
    ])('%sの場合はポート番号のプロパティを編集できる', (_, useNgrok, token) => {
      const locked = getLockedProperties(
        { ngrok_setting: { use_ngrok: useNgrok } },
        token
      );
      portKeys.forEach((key) => expect(locked[key]).toBeUndefined());
    });

    test('Ngrokを利用してもポート番号以外のプロパティは編集できる', () => {
      const locked = getLockedProperties(
        { ngrok_setting: { use_ngrok: true } },
        'token'
      );
      ['rcon.port', 'motd', 'server-ip'].forEach((key) =>
        expect(locked[key]).toBeUndefined()
      );
    });
  });
}
