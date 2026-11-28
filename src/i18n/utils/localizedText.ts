// Vitest は `src/` のエイリアスを持たないため，テストからも読み込めるよう `app/` 経由で参照する
import type { LocalizedText } from 'app/src-electron/schema/outerResource/common';

/** 表示中の言語の文言がない場合に，代わりに表示する言語（優先順） */
const FALLBACK_LOCALES = ['en-US', 'ja'];

/**
 * 外部リソースの言語ごとの文言から，表示中の言語の文言を選ぶ
 *
 * 表示中の言語の文言がない場合は，英語 → 日本語 → 定義されている最初の言語 の順で代わりの文言を選ぶ
 *
 * @param text 言語ごとの文言
 * @param locale 表示中の言語（例：`ja`）
 * @returns 表示する文言（文言が1つもない場合は空文字列）
 */
export function resolveLocalizedText(
  text: LocalizedText,
  locale: string
): string {
  for (const candidate of [locale, ...FALLBACK_LOCALES]) {
    const value = text[candidate];
    if (value !== undefined) return value;
  }
  return Object.values(text)[0] ?? '';
}
