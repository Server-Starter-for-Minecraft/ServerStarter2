import { describe, expect, test } from 'vitest';
import { resolveLocalizedText } from './localizedText';

describe('外部リソースの文言の言語選択', () => {
  const text = { ja: '日本語', 'en-US': 'English' };

  test('表示中の言語の文言を選ぶ', () => {
    expect(resolveLocalizedText(text, 'ja')).toBe('日本語');
    expect(resolveLocalizedText(text, 'en-US')).toBe('English');
  });

  test('表示中の言語の文言がなければ英語を選ぶ', () => {
    expect(resolveLocalizedText(text, 'fr')).toBe('English');
  });

  test('英語もなければ日本語を選ぶ', () => {
    expect(resolveLocalizedText({ ja: '日本語', fr: 'Français' }, 'de')).toBe(
      '日本語'
    );
  });

  test('対応する言語がなければ定義されている文言を選ぶ', () => {
    expect(resolveLocalizedText({ fr: 'Français' }, 'ja')).toBe('Français');
  });
});
