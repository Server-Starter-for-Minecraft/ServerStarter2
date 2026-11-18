/**
 * 外部リソース（OuterResources リポジトリ）の配布ファイルを扱うスクリプト
 *
 * 使い方
 * - `bun run outer-resources schema`
 *     配布ファイルの JSON Schema を `src-electron/schema/outerResource/jsonSchema/v{n}/schema/` に書き出す
 *     （スキーマを変更したら実行してコミットし，OuterResources リポジトリの `serverstarter2/v{n}/schema/` にもコピーする）
 * - `bun run outer-resources export <OuterResources リポジトリのパス>`
 *     JSON Schema と配布ファイルの初期データ（アプリ内の定義から作ったもの）を `serverstarter2/` に書き出す
 * - `bun run outer-resources pull [配布元の URL または serverstarter2/ のパス]`
 *     配布元の最新の内容を，アプリに同梱する外部リソース（`src-electron/source/outerResource/bundled/`）として書き出す
 *     （リリース時のビルドで実行する。配布元を省略した場合は OuterResources の main から取得する）
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import {
  DEFAULT_OUTER_RESOURCE_BASE_URL,
  distributionPath,
} from '../../src-electron/source/outerResource/definition';
import { outerResourceDefinitions } from '../../src-electron/source/outerResource/definitions';
import { generateJsonSchemas } from '../../src-electron/source/outerResource/distribution';
import { buildInitialDistribution } from './initialDistribution';
import { buildBundledContent, createDistributionReader } from './pull';

/** アプリに同梱する外部リソースの保存先（配布元の `serverstarter2/` と同じ構成で保存する） */
const BUNDLED_DIR = 'src-electron/source/outerResource/bundled';

/** JSON をファイルに書き出す（Prettier の書式に合わせて2スペースで字下げし，末尾に改行を付ける） */
function writeJson(path: string, content: object) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`);
}

/** JSON Schema を指定したディレクトリに（配布元と同じ構成で）書き出す */
function writeSchemas(dir: string) {
  for (const [path, schema] of Object.entries(generateJsonSchemas())) {
    writeJson(join(dir, path), schema);
  }
}

const [command, target] = process.argv.slice(2);

switch (command) {
  case 'schema': {
    const dir = 'src-electron/schema/outerResource/jsonSchema';
    writeSchemas(dir);
    console.log(`wrote JSON Schemas to ${dir}`);
    break;
  }
  case 'export': {
    if (target === undefined) {
      console.error('usage: bun run outer-resources export <dir>');
      process.exit(1);
    }
    const dir = join(target, 'serverstarter2');
    const { files, images } = buildInitialDistribution();
    writeSchemas(dir);
    for (const [fileName, content] of Object.entries(files)) {
      writeJson(join(dir, fileName), content);
    }
    for (const [path, bytes] of Object.entries(images)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), bytes);
    }
    console.log(`exported initial distribution to ${dir}`);
    break;
  }
  case 'pull': {
    const read = createDistributionReader(
      target ?? DEFAULT_OUTER_RESOURCE_BASE_URL
    );
    // すべての外部リソースを読み込めた場合のみ書き出す（一部だけ更新された同梱データを作らない）
    const contents = await Promise.all(
      Object.values(outerResourceDefinitions).map(
        async (def) =>
          [distributionPath(def), await buildBundledContent(def, read)] as const
      )
    );
    for (const [path, content] of contents) {
      writeJson(join(BUNDLED_DIR, path), content as object);
    }
    console.log(`updated bundled outer resources in ${BUNDLED_DIR}`);
    break;
  }
  default:
    console.error(
      'usage: bun run outer-resources <schema | export <dir> | pull [source]>'
    );
    process.exit(1);
}
