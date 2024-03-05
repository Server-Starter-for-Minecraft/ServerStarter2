let selecter: ((value: boolean) => void) | undefined;

export interface UpdateNotifyProp {
  os: 'windows' | 'macOS' | 'linux';
  required?: boolean;
}

/**
 * バックエンドからの通信を待機し，要求があった場合は選択内容を返却する
 */
export function setUpdateHandler(
  resolve: (value: boolean | PromiseLike<boolean>) => void
) {
  selecter = (value: boolean) => {
    selecter = undefined;
    resolve(value);
  };
}

/**
 * 選択内容を指定する
 */
export function updateSelecter(select: boolean) {
  selecter?.(select);
}
