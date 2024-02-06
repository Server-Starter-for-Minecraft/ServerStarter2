import { settingPath } from '../const';
import { SystemSettings } from 'src-electron/schema/system';
import { fixSystemSettings } from '../fixers/system';
import { safeStorage } from 'electron';
import { readFileSync, writeFileSync } from 'fs-extra';

// 設定ファイルの書き込み
function write(settings: SystemSettings) {
  systemSettingsValue = settings;

  // 文字列化
  const stringified = JSON.stringify(settings);

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
    parsed = undefined;
  }
  const fixed = fixSystemSettings(parsed);
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
