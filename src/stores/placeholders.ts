import { UUID, WorldName } from 'app/src-electron/schema/brands';
import { StaticResouce } from 'app/src-electron/schema/static';
import { SystemSettings } from 'app/src-electron/schema/system';
import { WorldID } from 'app/src-electron/schema/world';

/**
 * Store の状態の，値が決まる前の仮の値
 *
 * 選択していないことを表す空の ID・名前と，起動時の初期化処理（`src/init.ts`）で読み込むまでの空の値。
 * 型の上では有効な値として扱うため，ここでのみ型アサーションを使う（lint の例外として登録している）
 */

/** ワールドを選択していないことを表す ID（ID の形式ではないため，実在するワールドの ID と重ならない） */
export const NO_WORLD_ID = '' as WorldID;

/** ワールド名を入力していないことを表す名前 */
export const NO_WORLD_NAME = '' as WorldName;

/** プレイヤーのグループを選択していないことを表す ID */
export const NO_GROUP_ID = '' as UUID;

/**
 * 起動時に読み込むまでの，バックエンドの静的な情報
 *
 * Store ごとに別のオブジェクトを使うよう，呼び出すたびに新しく作る
 *
 * @returns 空の静的な情報
 */
export function unloadedStaticResource(): StaticResouce {
  return {} as StaticResouce;
}

/**
 * 起動時に読み込むまでの，システム設定
 *
 * Store ごとに別のオブジェクトを使うよう，呼び出すたびに新しく作る
 *
 * @returns 空のシステム設定
 */
export function unloadedSystemSettings(): SystemSettings {
  return {} as SystemSettings;
}
