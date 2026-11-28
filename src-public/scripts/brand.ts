import { z } from 'zod';

/**
 * 文字列を，文字列のブランド型（`z.string().brand(...)` で定義したもの）の値として扱う
 *
 * zod の parse は失敗時に例外を投げるため，形式に制約のない文字列のブランド型を付けるだけの用途ではこの関数を使う。
 * バックエンド・フロントエンドの両方から使うため src-public に置く（バックエンドは util/zod/brand からも読み込める）
 * （形式に制約のあるブランド型（UUID など）には使わず，safeParse で検証すること）
 *
 * @param _schema 値の型を決めるブランド型のスキーマ
 * @param value ブランド型にする文字列
 * @returns ブランド型の値
 */
export function asBrand<S extends z.ZodType<string, string>>(
  _schema: S,
  value: string
): z.output<S> {
  return value as z.output<S>;
}
