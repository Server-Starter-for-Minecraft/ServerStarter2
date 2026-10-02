import { z } from 'zod';
import { mainPath } from '../source/const';
import { Path } from '../util/binary/path';
import { isError } from '../util/error/error';

/**
 * 自動アップデートを実行した記録
 *
 * アップデートに失敗した場合に、起動のたびにアップデートを繰り返して
 * ServerStarter2を利用できなくなるのを防ぐために利用する
 */
export const UpdateAttempt = z.object({
  /** アップデートしようとしたバージョン（接頭辞vのついたSemVer e.g. "v1.2.3"） */
  version: z.string(),
  /** アップデートを実行した日時（エポックミリ秒） */
  attemptedAt: z.number(),
});
export type UpdateAttempt = z.infer<typeof UpdateAttempt>;

/** 同じバージョンへの自動アップデートを再度試みるまでの間隔（ミリ秒） */
export const UPDATE_RETRY_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** 自動アップデートの実行記録を保存するファイル */
const UPDATE_ATTEMPT_PATH = mainPath.child('serverstarter/update_attempt.json');

/**
 * 最新版への自動アップデートを実行してよいかを判定する
 *
 * 同じバージョンへのアップデートを直近に実行したにもかかわらず、まだ古いバージョンで起動している場合は、
 * アップデートに失敗したとみなして自動アップデートを行わない（一定時間経過後に再度試みる）
 *
 * @param latestVersion アップデート先のバージョン
 * @param lastAttempt 前回の自動アップデートの実行記録
 * @param now 現在日時（エポックミリ秒）
 * @returns 自動アップデートを実行してよい場合はtrue
 */
export function shouldAutoInstall(
  latestVersion: string,
  lastAttempt: UpdateAttempt | undefined,
  now: number
): boolean {
  if (lastAttempt === undefined) return true;
  if (lastAttempt.version !== latestVersion) return true;
  return now - lastAttempt.attemptedAt >= UPDATE_RETRY_INTERVAL_MS;
}

/**
 * 前回の自動アップデートの実行記録を読み込む
 *
 * @param path 実行記録のファイル（テスト用に差し替え可能）
 * @returns 実行記録（記録が無い・読み込めない場合はundefined）
 */
export async function loadUpdateAttempt(
  path: Path = UPDATE_ATTEMPT_PATH
): Promise<UpdateAttempt | undefined> {
  if (!path.exists()) return undefined;
  const attempt = await path.readJson(UpdateAttempt);
  return isError(attempt) ? undefined : attempt;
}

/**
 * 自動アップデートの実行記録を保存する（アップデートの実行直前に呼び出す）
 *
 * @param attempt 実行記録
 * @param path 実行記録のファイル（テスト用に差し替え可能）
 */
export async function saveUpdateAttempt(
  attempt: UpdateAttempt,
  path: Path = UPDATE_ATTEMPT_PATH
) {
  return await path.writeJson(attempt);
}
