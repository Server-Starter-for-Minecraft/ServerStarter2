/**
 * lint の一括抑制（`eslint-suppressions.json`）が増えていないかを確認する
 *
 * CI（`.github/workflows/linter.yml`）で，ベースブランチの抑制ファイルと比べるために使う。
 * 抑制が増えている場合は，その一覧を出力して終了コード 1 で終わる
 *
 * 使い方: bun scripts/lint/checkSuppressions.ts <変更前の抑制ファイル> <変更後の抑制ファイル>
 * （ファイルが存在しない場合は，抑制なしとして扱う）
 */
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { Failable } from 'app/src-electron/util/error/failable';
import { EslintSuppressions, findIncreasedSuppressions } from './suppressions';

/**
 * 抑制ファイルを読み込む
 *
 * @param path 抑制ファイルのパス
 * @returns 抑制ファイルの内容（ファイルが存在しない場合は抑制なし）
 */
async function readSuppressions(
  path: Path
): Promise<Failable<EslintSuppressions>> {
  if (!(await path.exists())) return {};
  return path.readJson(EslintSuppressions);
}

const [beforePath, afterPath] = process.argv.slice(2);
if (beforePath === undefined || afterPath === undefined) {
  console.error(
    'usage: bun scripts/lint/checkSuppressions.ts <before.json> <after.json>'
  );
  process.exit(1);
}

const before = await readSuppressions(new Path(beforePath));
const after = await readSuppressions(new Path(afterPath));
if (isError(before) || isError(after)) {
  console.error('failed to read suppressions', { before, after });
  process.exit(1);
}

const increased = findIncreasedSuppressions(before, after);
if (increased.length > 0) {
  console.error(
    'lint の抑制（eslint-suppressions.json）が増えています。違反を修正するか，やむを得ない場合は理由を PR に記載してメンテナーの承認を得てください'
  );
  for (const { file, rule, before, after } of increased) {
    console.error(`  ${file}: ${rule} (${before} -> ${after})`);
  }
  process.exit(1);
}
console.log('lint の抑制は増えていません');
