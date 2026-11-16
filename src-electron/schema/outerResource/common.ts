import { z } from 'zod';

/**
 * 外部リソース（OuterResources リポジトリで配布する JSON）の共通スキーマ
 *
 * 配布ファイルのスキーマは JSON Schema に変換してリモート側の検証にも使うため，
 * `transform` や `brand` など JSON Schema で表現できない機能は使わないこと
 */

/**
 * 言語ごとの文言（例：`{ "ja": "日本語", "en-US": "English" }`）
 *
 * キーはアプリの言語設定（`Locale`）の値とし，未定義の言語はフォールバックの文言を表示する。
 * 言語を追加しても旧バージョンのアプリが読み込めるよう，キーは `Locale` に限定しない
 */
export const LocalizedText = z
  .record(z.string(), z.string().min(1))
  .refine((text) => Object.keys(text).length > 0, {
    message: 'at least one locale is required',
  })
  .meta({ description: '言語ごとの文言（キーは ja / en-US）' });
export type LocalizedText = z.infer<typeof LocalizedText>;

/** https の URL（JSON Schema でも検証できるよう，形式に加えて先頭の文字列も指定する） */
export const HttpsUrl = z.url({ protocol: /^https$/ }).regex(/^https:\/\//);

/**
 * 画像の参照先
 *
 * - 配布ファイルからの相対パス（例：`icons/ofuse.png`）
 * - https の URL
 * - data URI（`data:image/png;base64,...`）
 */
export const ImageSource = z.string().min(1).meta({
  description:
    '画像の参照先（配布ファイルからの相対パス・https の URL・data URI のいずれか）',
});

/**
 * 不正な要素だけを取り除いて読み込む配列のパーサーを作る
 *
 * 外部リソースの一部に誤りがあっても，正しい要素は表示できるようにするために使う。
 * （JSON Schema の生成や厳格な検証には，元の要素のスキーマを `z.array` で包んだものを使う）
 *
 * @param item 要素のスキーマ
 * @returns 不正な要素を除いた配列を返すパーサー
 */
export function lenientArray<T extends z.ZodType>(item: T) {
  return z.array(z.unknown()).transform((values) =>
    values.flatMap((value) => {
      const parsed = item.safeParse(value);
      return parsed.success ? [parsed.data as z.output<T>] : [];
    })
  );
}

/**
 * 不正な値だけを取り除いて読み込むレコード（キーと値の組）のパーサーを作る
 *
 * @param value 値のスキーマ
 * @returns 不正な値のキーを除いたレコードを返すパーサー
 */
export function lenientRecord<T extends z.ZodType>(value: T) {
  return z
    .record(z.string(), z.unknown())
    .transform((record): Record<string, z.output<T>> =>
      // `__proto__` などのキーでもプロトタイプを書き換えないよう，代入ではなく Object.fromEntries で作る
      Object.fromEntries(
        Object.entries(record).flatMap(([key, raw]) => {
          const parsed = value.safeParse(raw);
          return parsed.success ? [[key, parsed.data as z.output<T>]] : [];
        })
      )
    );
}
