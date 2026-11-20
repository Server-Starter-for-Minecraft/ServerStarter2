import dayjs from 'dayjs';
import { safeStorage } from 'electron';
import { api } from 'src-electron/core/api';
import { onReadyWindow } from 'src-electron/lifecycle/lifecycle';
import { ErrorMessage } from 'src-electron/schema/error';
import {
  DEFAULT_SYSTEM_SETTINGS,
  SystemSettings,
} from 'src-electron/schema/system';
import { BytesData } from 'src-electron/util/binary/bytesData';
import { Path } from 'src-electron/util/binary/path';
import { deepcopy } from 'src-electron/util/deepcopy';
import { errorMessage } from 'src-electron/util/error/construct';
import { fromRuntimeError, isError } from 'src-electron/util/error/error';
import { Failable, safeExec } from 'src-electron/util/error/failable';
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

/** 読み込めなかった設定ファイルのバックアップの名前の接頭辞 */
const BROKEN_BACKUP_PREFIX = `${settingPath.basename()}.broken-`;

/**
 * 読み込めなかった設定ファイルのバックアップを残す期間（日）
 *
 * 読み込みの失敗が繰り返されてもバックアップが増え続けないよう，ログのアーカイブと同じ期間で削除する
 */
const BROKEN_BACKUP_RETENTION_DAYS = 7;

/**
 * 設定ファイルを読み込む
 *
 * @returns 設定（ファイルが無い場合は既定値。ファイルはあるが読み込めない場合はエラー）
 */
async function read(): Promise<Failable<SystemSettings>> {
  // ファイルが無い場合（初回起動など）は既定値で始める
  if (!(await settingPath.exists())) return deepcopy(DEFAULT_SYSTEM_SETTINGS);

  const encrypted = await settingPath.read();
  if (isError(encrypted)) return encrypted;
  // 復号してパース
  const decrypted = safeExec((): unknown =>
    JSON.parse(safeStorage.decryptString(encrypted.data))
  );
  if (isError(decrypted)) return decrypted;
  // 古いバージョンの内容も読み込めるよう、最新のスキーマに変換してから検証する
  const fixed = systemSettingsSchema.safeParse(decrypted);
  if (!fixed.success) return fromRuntimeError(fixed.error);
  return fixed.data;
}

/**
 * 読み込めなかった設定ファイルをバックアップする
 *
 * 既定値で起動した後の保存でユーザーの設定が失われないよう，上書きされる前に別名で残す
 *
 * @returns バックアップの保存先
 */
async function backupBrokenSettings(): Promise<Failable<Path>> {
  const backupPath = settingPath
    .parent()
    .child(`${BROKEN_BACKUP_PREFIX}${dayjs().format('YYYYMMDD-HHmmss')}`);
  const copied = await settingPath.copyTo(backupPath);
  if (isError(copied)) return copied;
  return backupPath;
}

/** 保存期間を過ぎた，読み込めなかった設定ファイルのバックアップを削除する */
async function removeExpiredBackups() {
  const paths = await settingPath.parent().iter();
  if (isError(paths)) {
    loggers().removeExpiredBackups().warn(paths);
    return;
  }
  const threshold = dayjs().subtract(BROKEN_BACKUP_RETENTION_DAYS, 'd');
  for (const path of paths) {
    if (!path.basename().startsWith(BROKEN_BACKUP_PREFIX)) continue;
    if (!(await path.lastUpdateTime()).isBefore(threshold)) continue;
    const removed = await path.remove();
    // 削除できなくても次回の起動時に再度削除を試みる
    if (isError(removed)) loggers().removeExpiredBackups().warn(removed);
  }
}

/**
 * 設定ファイルを読み込めなかった場合の処理
 *
 * 読み込めなかったファイルをバックアップしてから既定値で起動し，画面の準備ができたらユーザーへ通知する
 *
 * @param error 読み込めなかった原因
 * @returns 起動に使う設定（既定値）
 */
async function recoverFromBrokenSettings(
  error: ErrorMessage
): Promise<SystemSettings> {
  loggers().read().error(error);
  const backup = await backupBrokenSettings();
  let backupPath = '';
  if (isError(backup)) loggers().backup().error(backup);
  else backupPath = backup.path;

  const notification = errorMessage.core.brokenSystemSettings({ backupPath });
  // 起動直後は画面の準備ができていないため，準備ができた時点で通知する
  onReadyWindow(() => api.send.Error(notification), true);

  return deepcopy(DEFAULT_SYSTEM_SETTINGS);
}

let systemSettingsValue: SystemSettings | undefined;
/** 起動後最初の読み込み（同時に呼ばれても読み込みは一度だけ行う） */
let loading: Promise<SystemSettings> | undefined;

export async function getSystemSettings(): Promise<SystemSettings> {
  if (systemSettingsValue !== undefined) return systemSettingsValue;
  loading ??= (async () => {
    await removeExpiredBackups();
    const loaded = await read();
    // 読み込み中に設定が保存された場合は，保存された内容を優先する（古い内容で上書きしない）
    if (systemSettingsValue !== undefined) return systemSettingsValue;
    const result = isError(loaded)
      ? await recoverFromBrokenSettings(loaded)
      : loaded;
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
