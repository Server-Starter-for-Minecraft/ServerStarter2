import { Failable, isSuccess } from 'app/src-electron/api/failable';
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';

export const useErrorStore = defineStore('errorStore', {
  state: () => {
    return {
      description: '不明なエラーが発生しました。',
      error: 'エラー要因を表示できませんでした。'
    }
  }
})

/**
 * エラーが発生する可能性のある変数をチェックし、エラーがある場合はエラー画面を表示する
 * @param check エラーチェックをする変数
 * @param successProcess エラーがなかった場合の処理
 * @param errorDescription エラーが起きた場合の説明文（デフォルトは「不明なエラーが発生しました。」）
 */
export function checkError<S, F extends Error>(
  check: Failable<S, F>,
  successProcess: (checked: S) => void,
  errorDescription?: string
) {
  if (isSuccess(check)) {
    successProcess(check)
  }
  else {
    if (errorDescription !== void 0) { useErrorStore().description = errorDescription }
    useErrorStore().error = check.message
    useRouter().replace('/error')
  }
}