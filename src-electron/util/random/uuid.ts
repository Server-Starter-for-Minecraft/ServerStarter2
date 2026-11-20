import type { z } from 'zod';

/**UUIDの生成関数(フォーマット済み) */
export const genUUID = () => globalThis.crypto.randomUUID();

/**
 * UUID を生成し，UUID のブランド型（UUID・WorldID など）の値として返す
 *
 * randomUUID は常に正しい形式の UUID を返すため，例外を投げうる parse で検証せずにブランド型とする
 *
 * @param _schema 値の型を決める UUID のブランド型のスキーマ
 * @returns 生成した UUID
 */
export function genUUIDOf<S extends z.ZodType<string, unknown>>(
  _schema: S
): z.output<S> {
  return genUUID() as z.output<S>;
}

/**
 * uuidの文字列を正規化する
 * 0-0-0-0-0
 * 00000000000000000000000000000000
 * 00000000-0000-0000-0000-000000000000
 *
 * -> 00000000-0000-0000-0000-000000000000
 */
export function formatUUID(uuid: string): string {
  const hyphen_match = uuid.match(
    /([0-9a-f-]{1,8})-([0-9a-f-]{1,4})-([0-9a-f-]{1,4})-([0-9a-f-]{1,4})-([0-9a-f-]{1,12})/
  );

  if (hyphen_match !== null) {
    const result = [
      hyphen_match[1].padEnd(8, '0'),
      hyphen_match[2].padEnd(4, '0'),
      hyphen_match[3].padEnd(4, '0'),
      hyphen_match[4].padEnd(4, '0'),
      hyphen_match[5].padEnd(12, '0'),
    ].join('-');
    return result;
  }

  const non_hyphen_match = uuid.match(/([0-9a-f]{32})/);
  if (non_hyphen_match !== null) {
    const result = [
      uuid.slice(0, 8),
      uuid.slice(8, 12),
      uuid.slice(12, 16),
      uuid.slice(16, 20),
      uuid.slice(20, 32),
    ].join('-');
    return result;
  }

  return uuid;
}
