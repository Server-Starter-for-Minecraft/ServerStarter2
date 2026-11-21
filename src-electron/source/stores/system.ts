import { safeStorage } from 'electron';
import {
  DEFAULT_SYSTEM_SETTINGS,
  SystemSettings,
} from 'src-electron/schema/system';
import { BytesData } from 'src-electron/util/binary/bytesData';
import {
  fromRuntimeError,
  isError,
  isValid,
} from 'src-electron/util/error/error';
import { Failable, safeExec } from 'src-electron/util/error/failable';
import { ignoreError } from 'src-electron/util/error/ignore';
import { settingPath } from '../const';
import { sourceLoggers } from '../sourceLogger';
import { systemSettingsSchema } from './systemSchema';

const loggers = () => sourceLoggers().stores.system;

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

/**
 * 設定ファイルを読み込む
 *
 * @returns 設定（ファイルが無い場合は既定値。ファイルはあるが読み込めない場合はエラー）
 */
async function read(): Promise<Failable<SystemSettings>> {
  let parsed: unknown = {};
  // ファイルから読み取り（ファイルがない場合は既定値とする）
  const encrypted = await settingPath.read();
  if (isValid(encrypted)) {
    // 復号してパース
    const decrypted = safeExec((): unknown =>
      JSON.parse(safeStorage.decryptString(encrypted.data))
    );
    if (isError(decrypted)) return decrypted;
    parsed = decrypted;
  } else {
    ignoreError(
      encrypted,
      '設定ファイルが無い場合（初回起動など）は既定値で始める'
    );
  }
  // 古いバージョンの内容も読み込めるよう、最新のスキーマに変換してから検証する
  const fixed = systemSettingsSchema.safeParse(parsed);
  if (!fixed.success) return fromRuntimeError(fixed.error);
  return fixed.data;
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
    if (isError(result)) {
      // 設定ファイルを読み込めない場合は既定値で起動する。
      // ユーザーの設定を失わないよう，読み込めなかった設定ファイルは既定値で上書きしない
      loggers().read().error(result);
      systemSettingsValue = DEFAULT_SYSTEM_SETTINGS;
      return DEFAULT_SYSTEM_SETTINGS;
    }
    const written = await write(result);
    if (isError(written)) loggers().write().error(written);
    return result;
  })();
  return loading;
}

/** SystemSettingsを上書き */
export async function setSystemSettings(
  settings: SystemSettings
): Promise<SystemSettings> {
  // 保存に失敗しても，アプリの動作中は変更後の設定を使う（保存の失敗はログに残す）
  const written = await write(settings);
  if (isError(written)) loggers().write().error(written);
  return settings;
}
