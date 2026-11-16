import { z } from 'zod';
import { DonationResourceV1 } from 'app/src-electron/schema/outerResource/donation';
import { ServerPropertiesResourceV1 } from 'app/src-electron/schema/outerResource/serverProperties';

/**
 * 外部リソースの配布元（OuterResources リポジトリ）へ置くファイルを作る
 *
 * `scripts/outerResources` から配布ファイルの JSON Schema の更新に使い，契約テストでは配布元のスキーマと比較する
 */

/** 配布するスキーマのバージョン（配布元のディレクトリ名 `v{n}`） */
export const DISTRIBUTION_SCHEMA_VERSION = 1;

/** 配布ファイルの名前と厳格なスキーマの組（外部リソースを追加したらここにも追加する） */
const distributedSchemas: Record<string, z.ZodType> = {
  'donation.json': DonationResourceV1,
  'serverProperties.json': ServerPropertiesResourceV1,
};

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
 * @returns JSON Schema のファイル名（例：`donation.schema.json`）と内容の組
 */
export function generateJsonSchemas(): Record<string, object> {
  return Object.fromEntries(
    Object.entries(distributedSchemas).map(([fileName, schema]) => [
      fileName.replace(/\.json$/, '.schema.json'),
      withSchemaReference(z.toJSONSchema(schema, { target: 'draft-2020-12' })),
    ])
  );
}
