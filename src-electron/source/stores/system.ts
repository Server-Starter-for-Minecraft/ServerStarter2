import { safeStorage } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { SystemSettings } from 'src-electron/schema/system';
import { VersionedSchema } from 'src-electron/util/versioning/versionedSchema';
import { settingPath } from '../const';

/**
 * システム設定ファイルのスキーマのバージョン管理
 *
 * SystemSettingsの形式を変更する場合は、変更前のバージョンの内容を変換する処理を末尾に追加する
 */
export const systemSettingsSchema = new VersionedSchema(SystemSettings, [
  // 0 -> 1: バージョン管理を導入する前の内容（形式は同じため、そのまま扱う）
  (data) => data,
]);

// 設定ファイルの書き込み
function write(settings: SystemSettings) {
  systemSettingsValue = settings;

  // スキーマのバージョンを付与して文字列化
  const stringified = JSON.stringify(systemSettingsSchema.serialize(settings));

  // 暗号化
  const encrypted = safeStorage.encryptString(stringified);

  // ファイルに保存
  writeFileSync(settingPath.str(), encrypted);
}

// 設定ファイルの読み込み
function read() {
  let parsed: any;
  try {
    // ファイルから読み取り
    const encrypted = readFileSync(settingPath.str());
    // 復号
    const value = safeStorage.decryptString(encrypted);
    // パース
    parsed = JSON.parse(value) as SystemSettings;
  } catch {
    parsed = {};
  }
  // 古いバージョンの内容も読み込めるよう、最新のスキーマに変換してから検証する
  const fixed = SystemSettings.parse(systemSettingsSchema.migrate(parsed));
  return fixed;
}

let systemSettingsValue: SystemSettings;

export async function getSystemSettings(): Promise<SystemSettings> {
  if (systemSettingsValue !== undefined) return systemSettingsValue;
  const result = read();
  write(result);
  return result;
}

/** SystemSettingsを上書き */
export async function setSystemSettings(
  settings: SystemSettings
): Promise<SystemSettings> {
  write(settings);
  return settings;
}
