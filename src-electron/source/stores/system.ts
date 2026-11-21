import dayjs from 'dayjs';
import { safeStorage } from 'electron';
import { api } from 'src-electron/core/api';
import { onReadyWindow } from 'src-electron/lifecycle/lifecycle';
import { LOG_RETENTION_DAYS } from 'src-electron/logger/logger';
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
async function write(settings: SystemSettings): Promise<Failable<void>> {
  systemSettingsValue = settings;
  // 読み込めなかった設定ファイルを残すため，書き込みを止めている場合はメモリ上の設定のみ更新する
  if (isWriteBlocked) return;

  // スキーマのバージョンを付与して文字列化
  const stringified = JSON.stringify(systemSettingsSchema.serialize(settings));

  // 暗号化（暗号化できない環境では例外になるため，Failable に変換する）
  const encryptedBuffer = safeExec(() =>
    safeStorage.encryptString(stringified)
  );
  if (isError(encryptedBuffer)) return encryptedBuffer;
  const encrypted = await BytesData.fromBuffer(encryptedBuffer);
  if (isError(encrypted)) return encrypted;

  // ファイルに保存
  return settingPath.write(encrypted);
}

/** 読み込めなかった設定ファイルのバックアップの名前の接頭辞 */
const BROKEN_BACKUP_PREFIX = `${settingPath.basename()}.broken-`;

/**
 * バックアップの名前に付ける作成日時の書式
 *
 * 保存期間の判定にも使う（ファイルのコピーは更新日時を引き継ぐ場合があるため，更新日時では判定しない）
 */
const BROKEN_BACKUP_DATE_FORMAT = 'YYYYMMDD-HHmmss';

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
    .child(
      `${BROKEN_BACKUP_PREFIX}${dayjs().format(BROKEN_BACKUP_DATE_FORMAT)}`
    );
  const copied = await settingPath.copyTo(backupPath);
  if (isError(copied)) return copied;
  return backupPath;
}

/**
 * 保存期間を過ぎた，読み込めなかった設定ファイルのバックアップを削除する
 *
 * 読み込みの失敗が繰り返されてもバックアップが増え続けないよう，ログのアーカイブと同じ期間で削除する。
 * 作成日時は名前に含めた日時で判定する（Windows のファイルのコピーは元のファイルの更新日時を引き継ぐため，
 * 更新日時で判定すると，長く起動していなかった場合に作成直後のバックアップを消してしまう）
 */
async function removeExpiredBackups() {
  const paths = await settingPath.parent().iter();
  if (isError(paths)) {
    loggers().removeExpiredBackups().warn(paths);
    return;
  }
  // 書式の日時は辞書順と時刻順が一致するため，文字列のまま比較する
  const threshold = dayjs()
    .subtract(LOG_RETENTION_DAYS, 'd')
    .format(BROKEN_BACKUP_DATE_FORMAT);
  for (const path of paths) {
    const name = path.basename();
    if (!name.startsWith(BROKEN_BACKUP_PREFIX)) continue;
    const created = name.slice(BROKEN_BACKUP_PREFIX.length);
    // 名前の日時が書式と異なるファイル（ユーザーが名前を変えたもの等）は削除しない
    if (!/^\d{8}-\d{6}$/.test(created) || created >= threshold) continue;
    const removed = await path.remove();
    // 削除できなくても次回の起動時に再度削除を試みる
    if (isError(removed)) loggers().removeExpiredBackups().warn(removed);
  }
}

/**
 * 設定ファイルを読み込めなかった場合の処理
 *
 * 読み込めなかったファイルをバックアップしてから既定値で起動し，画面の準備ができたらユーザーへ通知する。
 * バックアップできなかった場合は，ユーザーの設定を失わないよう，このセッションでは設定ファイルを上書きしない
 *
 * @param error 読み込めなかった原因
 * @returns 起動に使う設定（既定値）
 */
async function recoverFromBrokenSettings(
  error: ErrorMessage
): Promise<SystemSettings> {
  loggers().read().error(error);
  const backup = await backupBrokenSettings();
  let notification: ErrorMessage;
  if (isError(backup)) {
    loggers().backup().error(backup);
    isWriteBlocked = true;
    notification = errorMessage.core.brokenSystemSettingsWithoutBackup();
  } else {
    notification = errorMessage.core.brokenSystemSettings({
      backupPath: backup.path,
    });
  }
  // 起動直後は画面の準備ができていないため，準備ができた時点で通知する
  onReadyWindow(() => api.send.Error(notification), true);

  return deepcopy(DEFAULT_SYSTEM_SETTINGS);
}

/**
 * 設定ファイルへの書き込みを止めているか
 *
 * 読み込めなかった設定ファイルをバックアップできなかった場合に，元のファイルを上書きしないために使う
 */
let isWriteBlocked = false;

let systemSettingsValue: SystemSettings | undefined;
/** 起動後最初の読み込み（同時に呼ばれても読み込みは一度だけ行う） */
let loading: Promise<SystemSettings> | undefined;

export async function getSystemSettings(): Promise<SystemSettings> {
  if (systemSettingsValue !== undefined) return systemSettingsValue;
  loading ??= (async () => {
    await removeExpiredBackups();
    const loaded = await read();
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
  // 最初の読み込みの途中で保存すると，読み込めなかったファイルのバックアップより先に上書きしたり，
  // 保存した内容を読み込みの結果（既定値）で上書きされたりするため，読み込みが済んでから保存する
  if (loading !== undefined) await loading;
  // 保存に失敗しても，アプリの動作中は変更後の設定を使う（保存の失敗はログに残す）
  const written = await write(settings);
  if (isError(written)) loggers().write().error(written);
  return settings;
}
