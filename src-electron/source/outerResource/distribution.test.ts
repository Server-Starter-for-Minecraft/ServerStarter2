import { describe, expect, test } from 'vitest';
import { Path } from 'app/src-electron/util/binary/path';
import { isValid } from 'app/src-electron/util/error/error';
import {
  DISTRIBUTION_SCHEMA_VERSION,
  generateJsonSchemas,
} from './distribution';

const schemaDir = new Path(__dirname).child(
  '../../schema/outerResource/jsonSchema',
  `v${DISTRIBUTION_SCHEMA_VERSION}`
);

describe('配布ファイルの JSON Schema', () => {
  test.each(Object.entries(generateJsonSchemas()))(
    '%s がスキーマの定義と一致する（スキーマを変更したら `bun run outer-resources schema` を実行する）',
    async (fileName, schema) => {
      const committed = await schemaDir.child(fileName).readText();
      expect(isValid(committed) && JSON.parse(committed)).toEqual(schema);
    }
  );
});
