import { ErrorMessage } from '../../schema/error';
import { utilLoggers } from '../utilLogger';

/**
 * 意図して無視してよいエラーであることを明示する
 *
 * 例：存在しなくてもよいキャッシュファイルの読み込みに失敗した場合など。
 * 通常のログを増やさないよう，無視したエラーは理由とともに debug レベルで記録する
 * （lint の `serverstarter/no-silent-error` は，この関数にエラーを渡すことを「処理した」とみなす）
 *
 * 戻り値は常に undefined のため，`isValid(x) ? x : ignoreError(x, '理由')` のように値の代わりにも使える
 *
 * @param error 無視するエラー
 * @param reason 無視してよい理由
 * @returns 常に undefined
 */
export function ignoreError(error: ErrorMessage, reason: string): undefined {
  utilLoggers().ignoreError({ reason }).debug(error);
  return undefined;
}
