import { describe, expect, test } from 'vitest';
import { fromJSONSchema, z } from 'zod';
import { Path } from 'app/src-electron/util/binary/path';
import { isValid } from 'app/src-electron/util/error/error';
import { distributionPath } from './definition';
import { outerResourceDefinitions } from './definitions';
import { generateJsonSchemas, schemaPath } from './distribution';

/** アプリのリポジトリでの JSON Schema の保存先（配布元の `serverstarter2/` と同じ構成で保存する） */
const schemaDir = new Path(__dirname).child(
  '../../schema/outerResource/jsonSchema'
);

/** 同梱データの保存先（`bun run outer-resources pull` の書き出し先） */
const bundledDir = new Path(__dirname).child('bundled');

describe('配布ファイルの JSON Schema', () => {
  test.each(Object.entries(generateJsonSchemas()))(
    '%s がスキーマの定義と一致する（スキーマを変更したら `bun run outer-resources schema` を実行する）',
    async (path, schema) => {
      const committed = await schemaDir.child(path).readText();
      expect(isValid(committed) && JSON.parse(committed)).toEqual(schema);
    }
  );
});

describe('配布ファイルの JSON Schema による検証', () => {
  /** 配布元での検証と同じく，生成した JSON Schema で配布ファイルを検証する */
  const validate = (
    def: { schemaVersion: number; fileName: string },
    data: unknown
  ) =>
    fromJSONSchema(
      generateJsonSchemas()[
        schemaPath(distributionPath(def))
      ] as z.core.JSONSchema.JSONSchema
    ).safeParse(data).success;

  test.each(Object.values(outerResourceDefinitions))(
    '同梱データ（$fileName）は検証に合格する',
    async (def) => {
      const text = await bundledDir.child(distributionPath(def)).readText();
      expect(isValid(text)).toBe(true);
      expect(validate(def, JSON.parse(text as string))).toBe(true);
    }
  );

  /**
   * 指定した文言を，言語ごとの文言の項目すべてに入れた配布ファイル
   *
   * 外部リソースを追加したら，ここにも追加する（未追加の場合は型エラーになる）
   */
  const documentWithText: Record<
    keyof typeof outerResourceDefinitions,
    (text: object) => unknown
  > = {
    donation: (text) => ({
      services: [
        {
          id: 'example',
          name: 'Example',
          url: 'https://example.com',
          color: '#000000',
          description: text,
          visible: true,
        },
      ],
    }),
    serverProperties: (text) => ({
      groups: [{ id: 'example', label: text }],
      properties: {
        'example-prop': {
          description: text,
          definitions: [{ type: 'boolean', default: false }],
        },
      },
    }),
  };

  // 空の辞書は読み込み時に要素ごと除かれるため，配布前の検証で拒否する
  test.each(Object.keys(documentWithText) as (keyof typeof documentWithText)[])(
    '%s の空の文言（{}）を拒否する',
    (key) => {
      const def = outerResourceDefinitions[key];
      expect(validate(def, documentWithText[key]({ ja: 'テキスト' }))).toBe(
        true
      );
      expect(validate(def, documentWithText[key]({}))).toBe(false);
    }
  );
});
