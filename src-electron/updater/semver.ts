/**
 * ServerStarter2のバージョン（SemVer）の比較
 *
 * ServerStarter2のリリースはプレリリース版を使わないため、`major.minor.patch` の3つの数値のみを比較する
 */

/** バージョン文字列を解釈した結果（`[major, minor, patch]`） */
type VersionNumbers = [number, number, number];

/**
 * バージョン文字列を数値の組に変換する
 *
 * @param version 接頭辞vの有無を問わないSemVer e.g. "v1.2.3" / "1.2.3"
 * @returns `[major, minor, patch]`（解釈できない場合はundefined）
 */
function parseVersion(version: string): VersionNumbers | undefined {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) return undefined;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * `target` が `current` より新しいバージョンかどうかを判定する
 *
 * いずれかのバージョンを解釈できない場合は、誤ったバージョンへ更新しないよう false を返す
 *
 * @param target 比較対象のバージョン（e.g. リリースのタグ名 "v1.2.4"）
 * @param current 基準となるバージョン（e.g. 起動中のバージョン "1.2.3"）
 * @returns `target` の方が新しい場合はtrue
 */
export function isNewerVersion(target: string, current: string): boolean {
  const t = parseVersion(target);
  const c = parseVersion(current);
  if (!t || !c) return false;
  for (let i = 0; i < t.length; i++) {
    if (t[i] !== c[i]) return t[i] > c[i];
  }
  return false;
}
