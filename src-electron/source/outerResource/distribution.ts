import { z } from 'zod';
import { distributionPath } from './definition';
import { outerResourceDefinitions } from './definitions';

/**
 * 外部リソースの配布元（OuterResources リポジトリ）へ置くファイルを作る
 *
 * `scripts/outerResources` から配布ファイルの JSON Schema の更新に使い，契約テストでは配布元のスキーマと比較する
 */

/**
 * 配布ファイルの JSON Schema の配布元でのパス（例：`v1/schema/donation.schema.json`）
 *
 * 配布ファイル（`v1/donation.json`）から `./schema/donation.schema.json` で参照できる場所に置く
 *
 * @param distribution 配布ファイルのパス（例：`v1/donation.json`）
 */
export function schemaPath(distribution: string) {
  return distribution.replace(
    /([^/]+)\.json$/,
    (_, name: string) => `schema/${name}.schema.json`
  );
}

/**
 * 配布ファイルの先頭に，エディタの補完用の JSON Schema の参照（`$schema`）を書けるようにする
 *
 * スキーマは未知の項目を禁止しているため（書き間違いを公開前に見つけるため），`$schema` だけを許可する
 */
function withSchemaReference(schema: z.core.JSONSchema.JSONSchema) {
  return {
    ...schema,
    properties: { $schema: { type: 'string' }, ...schema.properties },
  };
}

/**
 * 配布ファイルの JSON Schema を作る
 *
 * 配布元のリポジトリで，公開前に配布ファイルを検証するために使う
 *
 * @returns JSON Schema の配布元でのパス（例：`v1/schema/donation.schema.json`）と内容の組
 */
export function generateJsonSchemas(): Record<string, object> {
  return Object.fromEntries(
    Object.values(outerResourceDefinitions).map((def) => [
      schemaPath(distributionPath(def)),
      withSchemaReference(
        z.toJSONSchema(def.schema, { target: 'draft-2020-12' })
      ),
    ])
  );
}
