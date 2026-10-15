import type { Version } from 'app/src-electron/schema/version';

/**
 * バージョンの表示用ID（例: `1.20.4`）を取得する
 *
 * @param version 対象のバージョン
 * @returns バージョンID。バージョンが不明（`unknown`）な場合は空文字
 */
export function getVersionId(version: Version): string {
  return version.type === 'unknown' ? '' : version.id;
}
