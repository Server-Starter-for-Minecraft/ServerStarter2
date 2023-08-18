import { ErrorMessage } from "app/src-electron/schema/error";
import { ProgressMessage } from "app/src-electron/schema/progressMessage";
import { ErrorFuncReturns } from "src/components/Error/Error";
import { fromEntries, toEntries } from "src/scripts/obj";
import { flattenObj } from "src/scripts/objFlatten";

// argsのvalueに以下の文字列が来たときには翻訳を強制する
// TODO: value側の型定義を推敲
const translationArgs: Record<string, string> = {
  'vanilla': 'home.serverType.vanilla',
  'spigot': 'home.serverType.spigot',
  'papermc': 'home.serverType.papermc',
  'forge': 'home.serverType.forge',
  'mohistmc': 'home.serverType.mohistmc',
  'fabric': 'home.serverType.fabric'
}

type tFunc = (key: string, args?: Record<string, unknown> | string) => string
let _t: tFunc
export function setI18nFunc(t: tFunc) {
  _t = t
}

export function $T(key: string): string;
export function $T(key: string, args: Record<string, unknown>): string;
export function $T(key: string, defaultMessage: string): string;
/**
 * 翻訳で利用する変数部分にさらに翻訳が必要な値がわたってきた際に、
 * 翻訳済みの値を変数部分に再格納するためのラッパー
 */
export function $T(key: string, args?: Record<string, unknown> | string) {
  if (args === void 0) {
    return _t(key)
  }
  else if (typeof args === 'string') {
    return _t(key, args)
  }
  else {
    return _t(
      key,
      fromEntries(
        toEntries(args).map(
          v => {
            if (typeof v[1] === 'string' && v[1] in translationArgs) {
              return [v[0], _t(translationArgs[v[1]])]
            }
            else {
              return v
            }
          }
        )
      )
    )
  }
}

/**
 * プログレスの翻訳に当てるためのラッパー関数
 */
export function tProgress(progress: ProgressMessage) {
  if ('args' in progress) {
    return $T(`progress.${progress.key}`, flattenObj(progress.args as Record<string, string | number | string[]>))
  }
  else {
    return $T(`progress.${progress.key}`)
  }
}

/**
 * checkError()の第３引数にサンプルコードのように渡すことでエラー時の翻訳文を生成する
 * 
 * ```typescript
 * checkError(
 *   failableVariable,
 *   v => successProcess(v),
 *   e => tError(e)
 * )
 * ```
 * 
 * 原則ではエラーに対応したタイトルと説明文の翻訳を提示するが、
 * エラーの種類に関係なく一定のタイトルと説明文を表示する際には、当該翻訳が登録されたキーを引数に渡す
 * 
 * ```typescript
 * // tKey: タイトルの翻訳キー（フルパス）
 * // dKey: 説明文の翻訳キー（フルパス）
 * checkError(
 *   failableVariable,
 *   v => successProcess(v),
 *   e => tError(e, tKey, dKey)
 * )
 * ```
 * 
 * `tKey`のみを渡して`tError(e, tKey)`としても良い
 * 
 * 説明文の表示をオフにして、タイトルは(エラーに対応する翻訳を)表示する場合は`tError(e, undefined, '')`とする
 * 
 * 翻訳文を作成するときに利用できる変数は`flattenObj()`によって平坦化されるため、
 * ネスト構造になっていたとしても、それらを「.」でつなぐことで当該変数を利用できる
 */
export function tError(
  error: ErrorMessage,
  titleKey?: string,
  descKey?: string
) {
  // Key の更新
  let useTitleKey = `error.${error.key}.title`
  if (titleKey) useTitleKey = titleKey
  let useDescKey = `error.${error.key}.desc`
  if (descKey) useDescKey = descKey

  // 翻訳を生成
  const returnObj: ErrorFuncReturns = { title: '', desc: undefined }
  // Errorのタイトルは必ず表示するために、表示をオフにできない仕様
  if (error.arg) {
    returnObj.title = $T(useTitleKey, flattenObj(error.arg as Record<string, string | number | string[]>))
  }
  else {
    returnObj.title = $T(useTitleKey)
  }

  // 説明文は空文字列が来たら表示をオフにする
  if (useDescKey !== '') {
    if (error.arg) {
      returnObj.desc = $T(useDescKey, flattenObj(error.arg as Record<string, string | number | string[]>))
    }
    else {
      returnObj.desc = $T(useDescKey)
    }
  }

  return returnObj
}