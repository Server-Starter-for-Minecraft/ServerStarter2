import { SystemSettings } from 'src-electron/schema/system';
import { VersionedSchema } from 'src-electron/util/versioning/versionedSchema';
import { migrateGroupColorToDye } from './migrations/groupColor';

/**
 * システム設定ファイルのスキーマのバージョン管理
 *
 * SystemSettingsの形式を変更する場合は、変更前のバージョンの内容を変換する処理を末尾に追加する
 */
export const systemSettingsSchema = new VersionedSchema(SystemSettings, [
  // 0 -> 1: バージョン管理を導入する前の内容（形式は同じため、そのまま扱う）
  (data) => data,
  // 1 -> 2: プレイヤーグループの色をチャットの16色から染料の16色に変更
  migrateGroupColorToDye,
]);
