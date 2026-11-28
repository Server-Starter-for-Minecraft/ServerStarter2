import { safeStorage } from 'electron';
import { SystemSettings } from 'src-electron/schema/system';
import { BytesData } from 'src-electron/util/binary/bytesData';
import { isError, isValid } from 'src-electron/util/error/error';
import { settingPath } from '../const';
import { systemSettingsSchema } from './systemSchema';

// 設定ファイルの書き込み
async function write(settings: SystemSettings) {
  systemSettingsValue = settings;

  // スキーマのバージョンを付与して文字列化
  const stringified = JSON.stringify(systemSettingsSchema.serialize(settings));

  // 暗号化
  const encrypted = await BytesData.fromBuffer(
    safeStorage.encryptString(stringified)
  );
  if (isError(encrypted)) return encrypted;

  // ファイルに保存
  return settingPath.write(encrypted);
}

// 設定ファイルの読み込み
async function read() {
  let parsed: unknown = {};
  // ファイルから読み取り（ファイルがない場合は既定値とする）
  const encrypted = await settingPath.read();
  if (isValid(encrypted)) {
    try {
      // 復号してパース
      parsed = JSON.parse(safeStorage.decryptString(encrypted.data));
    } catch {
      parsed = {};
    }
  }
  // 古いバージョンの内容も読み込めるよう、最新のスキーマに変換してから検証する
  const fixed = systemSettingsSchema.parse(parsed);
  return fixed;
}

let systemSettingsValue: SystemSettings | undefined;
/** 起動後最初の読み込み（同時に呼ばれても読み込みは一度だけ行う） */
let loading: Promise<SystemSettings> | undefined;

export async function getSystemSettings(): Promise<SystemSettings> {
  if (systemSettingsValue !== undefined) return systemSettingsValue;
  loading ??= (async () => {
    const result = await read();
    // 読み込み中に設定が保存された場合は，保存された内容を優先する（古い内容で上書きしない）
    if (systemSettingsValue !== undefined) return systemSettingsValue;
    await write(result);
    return result;
  })();
  return loading;
}

/** SystemSettingsを上書き */
export async function setSystemSettings(
  settings: SystemSettings
): Promise<SystemSettings> {
  await write(settings);
  return settings;
}
