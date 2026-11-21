// @ts-check
import ts from 'typescript';

/**
 * 独自ルールで使う，型情報の判定処理
 *
 * 関数名などの文字列ではなく，TypeScript の型・宣言元で判定する
 */

/**
 * union 型を構成する型に分解する（union でなければその型だけを返す）
 *
 * @param {ts.Type} type 型
 * @returns {ts.Type[]} 構成する型の一覧
 */
export function unionParts(type) {
  return type.isUnion() ? type.types : [type];
}

/**
 * Promise のように `then` メソッドを持つ型か（union の場合はすべての構成要素が該当するか）
 *
 * @param {ts.TypeChecker} checker 型チェッカー
 * @param {ts.Type} type 判定する型
 * @returns {boolean} Promise のような型であれば true
 */
export function isThenable(checker, type) {
  return unionParts(type).every((part) => {
    const then = part.getProperty('then');
    if (then === undefined) return false;
    const thenType = checker.getTypeOfSymbol(then);
    return thenType.getCallSignatures().length > 0;
  });
}

/**
 * 関数の型の呼び出しシグネチャがすべて Promise のような型を返すか
 *
 * @param {ts.TypeChecker} checker 型チェッカー
 * @param {ts.Type} type 関数の型
 * @returns {boolean | undefined} すべて Promise を返せば true（関数でなければ undefined）
 */
export function returnsThenable(checker, type) {
  const signatures = type.getCallSignatures();
  if (signatures.length === 0) return undefined;
  return signatures.every((signature) =>
    isThenable(checker, signature.getReturnType())
  );
}

/**
 * 識別子・プロパティアクセスが指すシンボルを，import の別名を解決して返す
 *
 * @param {ts.TypeChecker} checker 型チェッカー
 * @param {ts.Node} node シンボルを調べるノード
 * @returns {ts.Symbol | undefined} 宣言元のシンボル
 */
export function resolveSymbol(checker, node) {
  const symbol = checker.getSymbolAtLocation(node);
  if (symbol === undefined) return undefined;
  return symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}
