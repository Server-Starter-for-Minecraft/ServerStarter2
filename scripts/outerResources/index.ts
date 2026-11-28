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
import { Failable } from 'app/src-electron/schema/error';
import {
  DEFAULT_OUTER_RESOURCE_BASE_URL,
  distributionPath,
} from 'app/src-electron/source/outerResource/definition';
import { outerResourceDefinitions } from 'app/src-electron/source/outerResource/definitions';
import { generateJsonSchemas } from 'app/src-electron/source/outerResource/distribution';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { buildInitialDistribution } from './initialDistribution';
import { buildBundledContent, createDistributionReader } from './pull';

/** アプリに同梱する外部リソースの保存先（配布元の `serverstarter2/` と同じ構成で保存する） */
const BUNDLED_DIR = new Path('src-electron/source/outerResource/bundled');

/** JSON Schema の保存先（アプリのリポジトリ内） */
const SCHEMA_DIR = new Path('src-electron/schema/outerResource/jsonSchema');

/**
 * 複数の書き出しの完了を待つ
 *
 * @param writes 書き出し中の処理
 * @returns 最初に失敗した書き出しのエラー（すべて成功した場合は undefined）
 */
async function waitAll(
  writes: Promise<Failable<void>>[]
): Promise<Failable<void>> {
  return (await Promise.all(writes)).find(isError);
}

/** JSON をファイルに書き出す（Prettier の書式に合わせて2スペースで字下げし，末尾に改行を付ける） */
async function writeJson(path: Path, content: unknown) {
  return path.writeText(`${JSON.stringify(content, null, 2)}
`);
}

/** JSON Schema を指定したディレクトリに（配布元と同じ構成で）書き出す */
async function writeSchemas(dir: Path) {
  return waitAll(
    Object.entries(generateJsonSchemas()).map(async ([path, schema]) =>
      writeJson(dir.child(path), schema)
    )
  );
}

/**
 * 配布ファイルの JSON Schema と初期データを，OuterResources リポジトリに書き出す
 *
 * @param repository OuterResources リポジトリのパス
 */
async function exportInitialDistribution(
  repository: string
): Promise<Failable<void>> {
  const dir = new Path(repository).child('serverstarter2');
  const { files, images } = buildInitialDistribution();
  const written = await waitAll([
    writeSchemas(dir),
    ...Object.entries(files).map(async ([path, content]) =>
      writeJson(dir.child(path), content)
    ),
  ]);
  if (isError(written)) return written;
  return waitAll(
    Object.entries(images).map(async ([path, bytes]) => {
      const data = await BytesData.fromBuffer(bytes);
      if (isError(data)) return data;
      return dir.child(path).write(data);
    })
  );
}

/**
 * 配布元の最新の内容を，アプリに同梱する外部リソースとして書き出す
 *
 * すべての外部リソースを読み込めた場合のみ書き出す（一部だけ更新された同梱データを作らない）
 *
 * @param source 配布元の URL または `serverstarter2/` のパス
 */
async function pullBundledContents(source: string): Promise<Failable<void>> {
  const read = createDistributionReader(source);
  const contents = await Promise.all(
    Object.values(outerResourceDefinitions).map(async (def) => ({
      path: distributionPath(def),
      content: await buildBundledContent(def, read),
    }))
  );
  const failed = contents.map(({ content }) => content).find(isError);
  if (failed !== undefined) return failed;
  return waitAll(
    contents.map(async ({ path, content }) =>
      writeJson(BUNDLED_DIR.child(path), content)
    )
  );
}

/**
 * コマンドを実行する
 *
 * @returns 完了時に表示する内容（失敗した場合はエラー）
 */
async function run(
  command: string | undefined,
  target: string | undefined
): Promise<Failable<string>> {
  switch (command) {
    case 'schema': {
      const written = await writeSchemas(SCHEMA_DIR);
      return isError(written)
        ? written
        : `wrote JSON Schemas to ${SCHEMA_DIR.path}`;
    }
    case 'export': {
      if (target === undefined) usage('export <dir>');
      const exported = await exportInitialDistribution(target);
      return isError(exported)
        ? exported
        : `exported initial distribution to ${target}`;
    }
    case 'pull': {
      const pulled = await pullBundledContents(
        target ?? DEFAULT_OUTER_RESOURCE_BASE_URL
      );
      return isError(pulled)
        ? pulled
        : `updated bundled outer resources in ${BUNDLED_DIR.path}`;
    }
    default:
      return usage('<schema | export <dir> | pull [source]>');
  }
}

/** 使い方を表示して終了する */
function usage(args: string): never {
  console.error(`usage: bun run outer-resources ${args}`);
  process.exit(1);
}

const [command, target] = process.argv.slice(2);
const result = await run(command, target);
if (isError(result)) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(result);
