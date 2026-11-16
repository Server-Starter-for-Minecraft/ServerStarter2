import { describe, expect, test } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { isValid } from 'app/src-electron/util/error/error';
import { generateJsonSchemas } from './distribution';

/** アプリのリポジトリでの JSON Schema の保存先（配布元の `serverstarter2/` と同じ構成で保存する） */
const schemaDir = new Path(__dirname).child(
  '../../schema/outerResource/jsonSchema'
);

describe('配布ファイルの JSON Schema', () => {
  test.each(Object.entries(generateJsonSchemas()))(
    '%s がスキーマの定義と一致する（スキーマを変更したら `bun run outer-resources schema` を実行する）',
    async (path, schema) => {
      const committed = await schemaDir.child(path).readText();
      expect(isValid(committed) && JSON.parse(committed)).toEqual(schema);
    }
  );
});
