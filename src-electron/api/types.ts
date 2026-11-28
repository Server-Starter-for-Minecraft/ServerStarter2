/**
 * 任意の引数を受け取り，R を返す関数の型（API の関数の型の上限として使う）
 *
 * 引数を never にすると，どのような引数の関数も代入できる（`any` を使わずに任意の関数を表す）
 */
export type AnyFunc<R> = (...args: never[]) => R;

/**
 * IPC の API の定義の形（`api.ts` の `interface API` が従う）
 *
 * 各項目は，API の名前（チャンネル）と関数の型の対応である
 */
export interface IAPI {
  sendMainToWindow: {
    [key in string]: AnyFunc<void>;
  };
  invokeMainToWindow: {
    [key in string]: AnyFunc<Promise<unknown>>;
  };
  sendWindowToMain: {
    [key in string]: AnyFunc<void>;
  };
  /**
   * フロントエンドから呼び出して結果を待つ API
   *
   * 処理は Promise を返す（非同期にする）。IPC の API の処理（ipc/back.ts）を同期の関数にすると，
   * この型の制約により型チェックで検出される（lint の独自ルールでは検査しない）
   */
  invokeWindowToMain: {
    [key in string]: AnyFunc<Promise<unknown>>;
  };
}

type Merge<T extends object> = { [K in keyof T]: T[K] };

export type FrontSend<C extends string, F extends AnyFunc<void>> = F & {
  __channel__: C;
};

export type FrontInvoke<
  C extends string,
  F extends AnyFunc<Promise<unknown>>,
> = F & {
  __channel__: C;
};

export type FrontOn<C extends string, F extends AnyFunc<void>> = ((
  listener: (event: Electron.IpcRendererEvent, ...args: Parameters<F>) => void
) => void) & {
  __channel__: C;
};

export type FrontHandle<C extends string, F extends AnyFunc<void>> = ((
  listener: (
    event: Electron.IpcRendererEvent,
    ...args: Parameters<F>
  ) => ReturnType<F>
) => void) & {
  __channel__: C;
};

export type IFrontAPI<T extends IAPI> = Merge<
  {
    [K in keyof T['sendMainToWindow'] as `on${K & string}`]: FrontOn<
      K & string,
      T['sendMainToWindow'][K]
    >;
  } & {
    [K in keyof T['sendWindowToMain'] as `send${K & string}`]: FrontSend<
      K & string,
      T['sendWindowToMain'][K]
    >;
  } & {
    [K in keyof T['invokeMainToWindow'] as `handle${K & string}`]: FrontHandle<
      K & string,
      T['invokeMainToWindow'][K]
    >;
  } & {
    [K in keyof T['invokeWindowToMain'] as `invoke${K & string}`]: FrontInvoke<
      K & string,
      T['invokeWindowToMain'][K]
    >;
  }
>;

export type BackSend<C extends string, F extends AnyFunc<void>> = F & {
  __channel__: C;
};

export type BackInvoke<
  C extends string,
  F extends AnyFunc<Promise<unknown>>,
> = F & {
  __channel__: C;
};

export type BackOn<C extends string, F extends AnyFunc<void>> = ((
  listener: (event: Electron.IpcMainEvent, ...args: Parameters<F>) => void
) => void) & {
  __channel__: C;
};

export type BackHandle<C extends string, F extends AnyFunc<void>> = ((
  listener: (
    event: Electron.IpcMainInvokeEvent,
    ...args: Parameters<F>
  ) => ReturnType<F>
) => void) & {
  __channel__: C;
};

export type IBackAPI<T extends IAPI> = Merge<
  {
    [K in keyof T['sendWindowToMain'] as `on${K & string}`]: BackOn<
      K & string,
      T['sendWindowToMain'][K]
    >;
  } & {
    [K in keyof T['sendMainToWindow'] as `send${K & string}`]: BackSend<
      K & string,
      T['sendMainToWindow'][K]
    >;
  } & {
    [K in keyof T['invokeWindowToMain'] as `handle${K & string}`]: BackHandle<
      K & string,
      T['invokeWindowToMain'][K]
    >;
  } & {
    [K in keyof T['invokeMainToWindow'] as `invoke${K & string}`]: BackInvoke<
      K & string,
      T['invokeMainToWindow'][K]
    >;
  }
>;
