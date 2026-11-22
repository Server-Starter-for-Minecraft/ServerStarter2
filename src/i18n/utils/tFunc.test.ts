import { describe, expect, test } from 'vitest';
import { setI18nFunc, tError } from './tFunc';

describe('tError', () => {
  // 翻訳は，キーと引数をそのまま文字列にして返す（翻訳の定義には依存しない）
  setI18nFunc(
    (key, args) => `${key}:${JSON.stringify(args ?? null)}`,
    () => true
  );

  test('引数の無いエラーでも，表題と説明文を翻訳できる', () => {
    const result = tError({
      type: 'error',
      key: 'core.minecraftEULANotAccepted',
      level: 'error',
    });

    expect(result).toEqual({
      title: 'error.core.minecraftEULANotAccepted.title:null',
      desc: 'error.core.minecraftEULANotAccepted.desc:{}',
    });
  });

  test('エラーの引数は，入れ子のキーを _ でつないで翻訳に渡す', () => {
    const result = tError({
      type: 'error',
      key: 'core.missingPersonalAccessToken',
      level: 'error',
      arg: { owner: 'owner', repo: 'repo' },
    });

    expect(result?.title).toBe(
      'error.core.missingPersonalAccessToken.title:{"owner":"owner","repo":"repo"}'
    );
  });
});
