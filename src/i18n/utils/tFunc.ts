import { ErrorMessage } from "app/src-electron/schema/error";
import { ProgressMessage } from "app/src-electron/schema/progressMessage";
import { fromEntries, toEntries } from "src/scripts/obj";
import { flattenObj } from "src/scripts/objFlatten";
import { useI18n } from "vue-i18n";

// argsのvalueに以下の文字列が来たときには翻訳を強制する
// TODO: value側の型定義を推敲
const translationArgs: Record<string, string> = {
  'vanilla': 'home.serverType.vanilla',
  'spigot': 'home.serverType.spigot'
}

const { t } = useI18n()

export function $T(key: string): string;
export function $T(key: string, args: Record<string, unknown>): string;
export function $T(key: string, defaultMessage: string): string;
export function $T(key: string, args?: Record<string, unknown> | string) {
  if (args === void 0) {
    return t(key)
  }
  else if (typeof args === 'string') {
    return t(key, args)
  }
  else {
    return t(
      key,
      fromEntries(
        toEntries(args).map(
          v => {
            if (typeof v[1] === 'string') {
              return [v[0], t(translationArgs[v[1]])]
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

export function tProgress(progress: ProgressMessage) {
  return $T(progress.key, flattenObj((progress as { 'args': Record<string, string | number | string[]>}).args))
}

export function tError(error: ErrorMessage) {
  if (error.arg) {
    return $T(error.key, flattenObj(error.arg as Record<string, string | number | string[]>))
  }
}