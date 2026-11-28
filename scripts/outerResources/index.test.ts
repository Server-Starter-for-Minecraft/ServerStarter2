import { spawn } from 'child_process';
import { describe, expect, test } from 'vitest';

/** リポジトリのルート */
const ROOT = new URL('../..', import.meta.url);

/**
 * `electron` を読み込めない環境で，外部リソースのスクリプトを実行する
 *
 * リリース時のビルド（.github/workflows/build.yml）は Electron を入れずにスクリプトを実行するため，同じ条件を再現する
 *
 * @param args スクリプトに渡す引数
 * @returns 終了コードと標準エラー出力
 */
async function runWithoutElectron(
  args: string[]
): Promise<{ code: number | null; stderr: string }> {
  // テストを Bun で実行していない場合も，スクリプトは Bun で実行する
  const bun = process.versions.bun !== undefined ? process.execPath : 'bun';
  const child = spawn(
    bun,
    [
      '--preload',
      './test/util/blockElectron.js',
      'scripts/outerResources/index.ts',
      ...args,
    ],
    { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] }
  );
  let stderr = '';
  child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
  const code = await new Promise<number | null>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });
  return { code, stderr };
}

describe('outer-resources スクリプト', () => {
  test('Electron を読み込めない環境でも起動できる', async () => {
    // 引数なしでは使い方を表示して終了する（すべてのモジュールを読み込めた場合のみ表示される）
    const { code, stderr } = await runWithoutElectron([]);

    expect(stderr).toContain('usage: bun run outer-resources');
    expect(code).toBe(1);
  }, 30_000);
});
