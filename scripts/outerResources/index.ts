/**
 * 外部リソース（OuterResources リポジトリ）の配布ファイルを扱うスクリプト
 *
 * 使い方
 * - `bun run outer-resources schema`
 *     配布ファイルの JSON Schema を `src-electron/schema/outerResource/jsonSchema/` に書き出す
 *     （スキーマを変更したら実行してコミットし，OuterResources リポジトリの `schema/` にもコピーする）
 * - `bun run outer-resources export <OuterResources リポジトリのパス>`
 *     JSON Schema と配布ファイルの初期データ（アプリ内の定義から作ったもの）を `serverstarter2/v{n}/` に書き出す
 */
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import {
  DISTRIBUTION_SCHEMA_VERSION,
  generateJsonSchemas,
} from '../../src-electron/source/outerResource/distribution';
import { buildInitialDistribution } from './initialDistribution';

/** JSON をファイルに書き出す（Prettier の書式に合わせて2スペースで字下げし，末尾に改行を付ける） */
function writeJson(path: string, content: object) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`);
}

/** JSON Schema を指定したディレクトリに書き出す */
function writeSchemas(dir: string) {
  for (const [fileName, schema] of Object.entries(generateJsonSchemas())) {
    writeJson(join(dir, fileName), schema);
  }
}

const [command, target] = process.argv.slice(2);
const versionDir = `v${DISTRIBUTION_SCHEMA_VERSION}`;

switch (command) {
  case 'schema': {
    const dir = join(
      'src-electron/schema/outerResource/jsonSchema',
      versionDir
    );
    writeSchemas(dir);
    console.log(`wrote JSON Schemas to ${dir}`);
    break;
  }
  case 'export': {
    if (target === undefined) {
      console.error('usage: bun run outer-resources export <dir>');
      process.exit(1);
    }
    const dir = join(target, 'serverstarter2', versionDir);
    const { files, images } = buildInitialDistribution();
    writeSchemas(join(dir, 'schema'));
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
  default:
    console.error('usage: bun run outer-resources <schema | export <dir>>');
    process.exit(1);
}
