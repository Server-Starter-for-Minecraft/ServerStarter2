import { safeStorage } from 'electron';
import { readFileSync, writeFileSync } from 'node:fs';
import { SystemSettings } from 'src-electron/schema/system';
import { settingPath } from '../const';
import { systemSettingsSchema } from './systemSchema';

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
  const fixed = systemSettingsSchema.parse(parsed);
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
